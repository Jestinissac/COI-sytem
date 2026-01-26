#!/usr/bin/env python3
"""
Database Connection Module
Provides SQLite database access for Python ML scripts.
Connects to the same database as the Node.js backend.
"""

import sqlite3
import os
import json
from pathlib import Path


def get_database_path():
    """
    Get the path to the SQLite database file.
    Uses the same logic as Node.js backend to determine database name.
    """
    # Get environment (default to development)
    env = os.getenv('NODE_ENV', 'development')
    
    # Map environment to database name (same as Node.js)
    db_names = {
        'production': 'coi.db',
        'staging': 'coi-staging.db',
        'test': 'coi-test.db',
        'development': 'coi-dev.db'
    }
    
    db_name = db_names.get(env, 'coi-dev.db')
    
    # Get path relative to this file
    # This file is at: backend/ml/database.py
    # Database is at: database/coi-dev.db
    current_dir = Path(__file__).parent
    db_path = current_dir / '..' / '..' / 'database' / db_name
    
    return str(db_path.resolve())


def get_connection():
    """
    Get a database connection.
    Returns a sqlite3.Connection object.
    """
    db_path = get_database_path()
    
    if not os.path.exists(db_path):
        raise FileNotFoundError(
            f"Database file not found: {db_path}\n"
            f"Please ensure the database has been initialized."
        )
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Enable column access by name
    return conn


def query(sql, params=None):
    """
    Execute a SELECT query and return results as a list of dictionaries.
    
    Args:
        sql: SQL query string
        params: Optional tuple or dict of parameters for parameterized queries
    
    Returns:
        List of dictionaries (one per row)
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        
        rows = cursor.fetchall()
        # Convert Row objects to dictionaries
        return [dict(row) for row in rows]
    finally:
        conn.close()


def query_one(sql, params=None):
    """
    Execute a SELECT query and return a single row as a dictionary.
    Returns None if no rows found.
    
    Args:
        sql: SQL query string
        params: Optional tuple or dict of parameters for parameterized queries
    
    Returns:
        Dictionary or None
    """
    results = query(sql, params)
    return results[0] if results else None


def execute(sql, params=None):
    """
    Execute an INSERT, UPDATE, or DELETE statement.
    
    Args:
        sql: SQL statement string
        params: Optional tuple or dict of parameters for parameterized queries
    
    Returns:
        Number of rows affected
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()


def execute_many(sql, params_list):
    """
    Execute the same SQL statement multiple times with different parameters.
    
    Args:
        sql: SQL statement string
        params_list: List of parameter tuples/dicts
    
    Returns:
        Number of rows affected
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.executemany(sql, params_list)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()


def get_training_data():
    """
    Extract training data from the database.
    This creates a view-like query that extracts all features needed for ML training.
    
    Returns:
        pandas.DataFrame with features and target variable
    """
    import pandas as pd
    from datetime import datetime
    
    sql = """
    SELECT 
        r.request_id,
        
        -- Time-based features (calculated using stage_entered_at and default SLA target)
        -- Note: Simplified calculation - uses 48h default target. Actual SLA uses sla_config table.
        -- For training, this approximation is acceptable as ML will learn the patterns.
        CASE 
            WHEN r.stage_entered_at IS NOT NULL THEN
                CAST((julianday(r.stage_entered_at) + (48.0 / 24.0) - julianday('now')) * 24 AS INTEGER)
            ELSE
                CAST((julianday(r.created_at) + (48.0 / 24.0) - julianday('now')) * 24 AS INTEGER)
        END as sla_hours_remaining,
        CASE 
            WHEN r.stage_entered_at IS NOT NULL THEN
                CAST(((julianday('now') - julianday(r.stage_entered_at)) / (48.0 / 24.0)) * 100 AS INTEGER)
            ELSE
                CAST(((julianday('now') - julianday(r.created_at)) / (48.0 / 24.0)) * 100 AS INTEGER)
        END as sla_percent_elapsed,
        
        -- Deadline features
        CASE WHEN r.external_deadline IS NOT NULL THEN 1 ELSE 0 END as has_external_deadline,
        COALESCE(CAST((julianday(r.external_deadline) - julianday(r.created_at)) AS INTEGER), 999) as days_to_deadline,
        
        -- Client features
        CASE WHEN r.pie_status = 'Yes' OR r.pie_status = 1 THEN 1 ELSE 0 END as is_pie,
        CASE WHEN r.international_operations = 1 OR r.international_operations = 'true' THEN 1 ELSE 0 END as is_international,
        
        -- Service features
        CASE WHEN r.service_type = 'STATUTORY_AUDIT' THEN 1 ELSE 0 END as is_statutory_audit,
        CASE WHEN r.service_type = 'TAX_COMPLIANCE' THEN 1 ELSE 0 END as is_tax_compliance,
        
        -- Escalation
        LEAST(COALESCE(r.escalation_count, 0), 3) as escalation_count,
        
        -- Stage features
        CASE r.status 
            WHEN 'Pending Director Approval' THEN 1
            WHEN 'Pending Compliance' THEN 2
            WHEN 'Pending Partner' THEN 3
            WHEN 'Pending Finance' THEN 4
            WHEN 'Active' THEN 5
            ELSE 0
        END as current_stage,
        
        -- Hours in current stage (using stage_entered_at if available)
        CAST((julianday('now') - julianday(COALESCE(r.stage_entered_at, r.updated_at, r.created_at))) * 24 AS INTEGER) as hours_in_stage,
        
        -- Requester workload (replaces assignee_workload - field doesn't exist)
        (SELECT COUNT(*) FROM coi_requests r2 
         WHERE r2.requester_id = r.requester_id 
         AND r2.status NOT IN ('Approved', 'Rejected', 'Lapsed')
         AND r2.request_id != r.request_id) as requester_workload,
        
        -- Temporal features
        CAST(strftime('%w', r.created_at) AS INTEGER) as day_of_week,
        CASE WHEN CAST(strftime('%d', r.created_at) AS INTEGER) > 25 THEN 1 ELSE 0 END as is_end_of_month,
        CASE WHEN CAST(strftime('%m', r.created_at) AS INTEGER) IN (10, 11, 12) THEN 1 ELSE 0 END as is_q4,
        
        -- TARGET VARIABLE (using actual fields and sla_breach_log table)
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM sla_breach_log b 
                WHERE b.coi_request_id = r.id 
                AND b.breach_type = 'BREACHED'
                AND b.resolved_at IS NULL
            ) THEN 1
            WHEN COALESCE(r.escalation_count, 0) > 0 THEN 1
            WHEN r.partner_override = 1 THEN 1
            WHEN r.complaint_logged = 1 THEN 1
            ELSE 0
        END as bad_outcome
        
    FROM coi_requests r
    WHERE r.status IN ('Approved', 'Rejected', 'Lapsed')
      AND r.created_at >= datetime('now', '-6 months')
    """
    
    rows = query(sql)
    
    if not rows:
        return pd.DataFrame()
    
    df = pd.DataFrame(rows)
    
    # Ensure numeric types
    numeric_cols = [
        'sla_hours_remaining', 'sla_percent_elapsed', 'has_external_deadline',
        'days_to_deadline', 'is_pie', 'is_international', 'is_statutory_audit',
        'is_tax_compliance', 'escalation_count', 'current_stage', 'hours_in_stage',
        'requester_workload', 'day_of_week', 'is_end_of_month', 'is_q4', 'bad_outcome'
    ]
    
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    return df
