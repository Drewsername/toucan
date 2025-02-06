import { describe, it, expect, beforeEach } from 'vitest'
import { useOfferStore } from '../offerStore'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'

describe('offerStore', () => {
  beforeEach(() => {
    useOfferStore.setState({
      offers: [],
      loading: false,
      error: null,
      currentDiscount: null
    })
  })

  it('should initialize with empty state', () => {
    const state = useOfferStore.getState()
    expect(state.offers).toEqual([])
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.currentDiscount).toBeNull()
  })

  it('should fetch offers', async () => {
    const { fetchOffers } = useOfferStore.getState()
    await fetchOffers()
    
    const state = useOfferStore.getState()
    expect(state.offers).toHaveLength(1)
    expect(state.offers[0]).toMatchObject({
      title: 'Test Offer',
      description: 'Test Description',
      points_cost: 50
    })
  })

  it('should add an offer', async () => {
    const { addOffer } = useOfferStore.getState()
    await addOffer('New Offer', 100, 'New Description', 'test')
    
    const state = useOfferStore.getState()
    expect(state.offers).toHaveLength(1)
    expect(state.offers[0]).toMatchObject({
      title: 'New Offer',
      description: 'New Description',
      points_cost: 100,
      category: 'test'
    })
  })

  it('should purchase an offer', async () => {
    const { addOffer, purchaseOffer } = useOfferStore.getState()
    await addOffer('Offer to Purchase', 100)
    
    const state = useOfferStore.getState()
    const offerId = state.offers[0].id
    await purchaseOffer(offerId)
    
    const newState = useOfferStore.getState()
    expect(newState.offers).toHaveLength(0)
  })

  it('should spin the wheel', async () => {
    const { addOffer, spinWheel } = useOfferStore.getState()
    await addOffer('Offer for Spin', 100)
    
    const state = useOfferStore.getState()
    const offerId = state.offers[0].id
    await spinWheel(offerId)
    
    const newState = useOfferStore.getState()
    expect(newState.currentDiscount).toMatchObject({
      offerId,
      percentage: 25,
      discountedCost: 37
    })
  })

  it('should clear discount', () => {
    const { spinWheel, clearDiscount } = useOfferStore.getState()
    spinWheel('123')
    clearDiscount()
    
    const state = useOfferStore.getState()
    expect(state.currentDiscount).toBeNull()
  })

  it('should handle errors', async () => {
    // Mock API error
    server.use(
      http.get('*/offers/available', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { fetchOffers } = useOfferStore.getState()
    await fetchOffers()
    
    const state = useOfferStore.getState()
    expect(state.error).toBe('Failed to fetch offers')
  })
}) 