// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import * as analysis from './application/pool-analysis'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

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

it('Given an evaluation limit failure, When settings are corrected, Then results recover without stale output', async () => {
  const user = userEvent.setup()
  vi.spyOn(analysis, 'evaluatePool').mockReturnValueOnce({ status: 'error', message: 'Branch limit exceeded: reduce dice or stages' })
  render(<App />)
  expect(screen.getByRole('alert').textContent).toContain('reduce dice or stages')
  expect(screen.queryByRole('heading', { name: 'Success distribution' })).toBeNull()
  await user.selectOptions(screen.getByRole('combobox', { name: 'Dice in the pool' }), '1')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Success distribution' })).toBeTruthy()
})
