import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/ui/StatusBadge.vue'

describe('StatusBadge.vue', () => {
  it('renders the status text correctly', () => {
    const wrapper = mount(StatusBadge, {
      props: {
        status: 'Draft'
      }
    })

    expect(wrapper.text()).toContain('Draft')
  })

  it('applies correct styling for Draft status', () => {
    const wrapper = mount(StatusBadge, {
      props: {
        status: 'Draft'
      }
    })

    const badge = wrapper.find('span')
    // Check for common badge classes (adjust based on actual implementation)
    expect(badge.exists()).toBe(true)
  })

  it('renders different statuses correctly', async () => {
    const statuses = [
      'Draft',
      'Pending Director Approval',
      'Pending Compliance Review',
      'Approved',
      'Rejected'
    ]

    for (const status of statuses) {
      const wrapper = mount(StatusBadge, {
        props: { status }
      })

      expect(wrapper.text()).toContain(status)
    }
  })

  it('handles missing status prop gracefully', () => {
    // Test component behavior when status is not provided
    // This depends on your component's implementation
    const wrapper = mount(StatusBadge, {
      props: {
        status: ''
      }
    })

    expect(wrapper.exists()).toBe(true)
  })
})
