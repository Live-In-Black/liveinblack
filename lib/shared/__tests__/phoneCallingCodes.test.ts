import { describe, expect, it } from 'vitest'
import { phoneCallingCodeOptions, splitContactPhone } from '../phoneCallingCodes'
import { regions } from '../regions'
import { isValidPhone } from '../applicationValidation'

describe('contact phone codes independent of launch regions', () => {
  it('keeps Benin as default without restricting contact numbers to Benin', () => {
    expect(phoneCallingCodeOptions[0].value).toBe('+229')
    for (const code of ['+228', '+33', '+1', '+44', '+39', '+81']) {
      expect(phoneCallingCodeOptions.some((option) => option.value === code)).toBe(true)
    }
    expect(new Set(phoneCallingCodeOptions.map((option) => option.value)).size).toBe(phoneCallingCodeOptions.length)
    expect(regions.map((region) => region.id)).toEqual(['benin'])
  })

  it.each([
    ['+2290196123456', '+229', '0196123456'],
    [' +442079460123 ', '+44', '2079460123'],
    ['+14155552671', '+1', '4155552671'],
    ['+81312345678', '+81', '312345678'],
    ['+390212345678', '+39', '0212345678'],
  ])('preserves a stored contact number %s', (phone, dialCode, number) => {
    expect(splitContactPhone(phone)).toEqual({ dialCode, number })
    expect(isValidPhone(dialCode, number)).toBe(true)
  })

  it('keeps unknown or national numbers intact rather than rewriting them', () => {
    expect(splitContactPhone('0196123456')).toEqual({ dialCode: '+229', number: '0196123456' })
    expect(splitContactPhone('')).toEqual({ dialCode: '+229', number: '' })
  })
})
