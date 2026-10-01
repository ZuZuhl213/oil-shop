import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CartProvider, useCart } from './CartContext';

function CartProbe() {
  const { items, addItem } = useCart();
  return (
    <>
      <output data-testid="count">{items.length}</output>
      <output data-testid="quantity">{items[0]?.quantity ?? 0}</output>
      <button
        type="button"
        onClick={() =>
          addItem({
            productId: 'p1',
            productName: 'Dầu cân',
            productSlug: 'dau-can',
            variantId: 'v1',
            variantName: '0.5kg',
            price: 90000,
            minQuantity: 0.5,
            quantityStep: 0.5,
            thumbnailType: 'peanut',
          })
        }
      >
        add
      </button>
    </>
  );
}

describe('CartProvider', () => {
  it('does not migrate the old demo cart array into a real order cart', async () => {
    window.localStorage.setItem('hm_naturals_cart_v1', JSON.stringify([{
      productId:'1',productName:'Demo oil',productSlug:'demo',variantId:'1',variantName:'1L',
      price:90000,quantity:1,thumbnailType:'peanut',
    }]));
    render(<CartProvider><CartProbe /></CartProvider>);
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));
  });
  it('drops malformed stored data and does not seed fake products', async () => {
    window.localStorage.setItem('hm_naturals_cart_v1', '{}');
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));
  });

  it('keeps fractional quantities according to the variant step', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'add' }));
    await waitFor(() => expect(screen.getByTestId('quantity')).toHaveTextContent('0.5'));
    const saved = JSON.parse(window.localStorage.getItem('hm_naturals_cart_v1') ?? '{}');
    expect(saved).toMatchObject({ version: 1, saleType: 'FIXED_PRICE', items: [{ quantity: 0.5 }] });
  });
});
