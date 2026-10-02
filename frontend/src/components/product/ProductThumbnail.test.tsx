import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ProductThumbnail } from './ProductThumbnail';

it('shows the saved thumbnail, falls back on load failure and accepts a new URL', () => {
  const { rerender } = render(<ProductThumbnail url="https://storage.test/oil.png" type="peanut" alt="Dầu lạc" />);
  expect(screen.getByRole('img', { name: 'Dầu lạc' })).toHaveAttribute('src', 'https://storage.test/oil.png');
  expect(screen.queryByText('Ảnh minh họa')).not.toBeInTheDocument();
  fireEvent.error(screen.getByRole('img', { name: 'Dầu lạc' }));
  expect(screen.getByText('Ảnh minh họa')).toBeVisible();
  rerender(<ProductThumbnail url="https://storage.test/new.png" type="peanut" alt="Dầu lạc" />);
  expect(screen.getByRole('img', { name: 'Dầu lạc' })).toHaveAttribute('src', 'https://storage.test/new.png');
});
