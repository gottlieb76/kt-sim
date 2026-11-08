// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

afterEach(cleanup)

it('updates pool settings, reroll policies, inspected stages, and reset results', async () => {
  const user = userEvent.setup()
  render(<App />)
  expect(screen.getByRole('combobox', { name: 'Dice in the pool' })).toHaveProperty('value', '4')
  expect(screen.getByText('3.202', { selector: 'strong' })).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Initial roll' }))
  expect(screen.getByText('2.667', { selector: 'strong' })).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'After reroll 1' }))
  await user.selectOptions(screen.getByRole('combobox', { name: 'Dice in the pool' }), '1')
  await user.selectOptions(screen.getByRole('combobox', { name: 'Hit on' }), '4')
  await user.selectOptions(screen.getByRole('combobox', { name: 'Which dice?' }), 'twos')
  expect(screen.getByText('0.583', { selector: 'strong' })).toBeTruthy()
  const successes = screen.getByRole('heading', { name: 'Success distribution' }).closest('section')!
  expect(within(successes).getByText('58.33%')).toBeTruthy()
  expect(within(successes).getByText('7/12')).toBeTruthy()
  await user.selectOptions(screen.getByRole('combobox', { name: 'Shared reroll budget' }), '0')
  expect(screen.queryByRole('button', { name: 'After reroll 1' })).toBeNull()
  expect(screen.getByText('0.500', { selector: 'strong' })).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Reset example' }))
  expect(screen.getByText('3.202', { selector: 'strong' })).toBeTruthy()
})
