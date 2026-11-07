import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FindingCard from '../src/features/content-review/FindingCard.jsx'

const findingTypes = [
  ['unsupported_claim', 'Unsupported claim'],
  ['numeric_mismatch', 'Numeric mismatch'],
  ['claim_stronger_than_evidence', 'Claim stronger than evidence'],
  ['missing_qualifier', 'Missing qualifier'],
  ['scope_mismatch', 'Scope mismatch'],
  ['expired_offer', 'Expired offer'],
  ['unapproved_terminology', 'Unapproved terminology'],
]

describe('FindingCard', () => {
  it.each(findingTypes)('renders the %s finding label and explanation', (findingType, label) => {
    render(
      <FindingCard
        finding={{
          id: findingType,
          finding_type: findingType,
          severity: 'high',
          explanation: 'This claim needs review.',
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: label })).toBeInTheDocument()
    expect(screen.getByText('This claim needs review.')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
  })
})
