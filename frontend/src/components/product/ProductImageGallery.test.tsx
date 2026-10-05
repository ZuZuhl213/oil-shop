import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ProductImageGallery } from './ProductImageGallery';
let intersect: (entries: { isIntersecting: boolean }[]) => void;
const images = [1,2,3].map((n) => ({ id: String(n), url: `https://media.test/${n}.png`, sortOrder: n-1 }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('IntersectionObserver', class { constructor(callback: typeof intersect) { intersect = callback; } observe() {} disconnect() {} });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
function mount() { return render(<ProductImageGallery images={images} thumbnailUrl={null} name="Dầu lạc" type="peanut" />); }
it('advances exactly after 5 seconds and manual navigation stops autoplay until Play', () => {
  mount();
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
  act(() => vi.advanceTimersByTime(4999));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[1].url);
  fireEvent.click(screen.getByRole('button', { name: 'Ảnh tiếp theo' }));
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[2].url);
  fireEvent.click(screen.getByRole('button', { name: 'Phát tự động' }));
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
});
it('pauses on hover and keyboard focus and cleans timers on unmount', () => {
  const view = mount(); const gallery = screen.getByRole('region', { name: 'Ảnh sản phẩm Dầu lạc' });
  fireEvent.mouseEnter(gallery); act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
  fireEvent.mouseLeave(gallery); act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[1].url);
  fireEvent.focus(screen.getByRole('button', { name: 'Ảnh tiếp theo' })); act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[1].url);
  view.unmount(); expect(vi.getTimerCount()).toBe(0);
});
it('uses thumbnail for legacy products and hides controls for one image', () => {
  render(<ProductImageGallery images={[]} thumbnailUrl="https://media.test/legacy.png" name="Oil" type="peanut" />);
  expect(screen.getByRole('img')).toHaveAttribute('src', 'https://media.test/legacy.png');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(vi.getTimerCount()).toBe(0);
});
it('does not autoplay with reduced motion', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  mount(); act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
  expect(screen.getByRole('button', { name: 'Phát tự động' })).toBeInTheDocument();
});

it('keyboard focus on autoplay stops playback until explicitly resumed', () => {
  mount();
  const play = screen.getByRole('button', { name: 'Dừng tự động' });
  fireEvent.focus(play);
  expect(screen.getByRole('button', { name: 'Phát tự động' })).toBeInTheDocument();
  fireEvent.blur(play, { relatedTarget: null });
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
});


it('resets a full interval after hidden or offscreen pause', () => {
  mount(); act(() => vi.advanceTimersByTime(4000));
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
  hidden.mockReturnValue(false); fireEvent(document, new Event('visibilitychange'));
  act(() => vi.advanceTimersByTime(4000));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
  act(() => intersect([{ isIntersecting: false }])); act(() => vi.advanceTimersByTime(10000));
  act(() => intersect([{ isIntersecting: true }])); act(() => vi.advanceTimersByTime(4999));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
  act(() => vi.advanceTimersByTime(1)); expect(screen.getByRole('img')).toHaveAttribute('src', images[1].url);
});

it('handles pointer cancellation and vertical gestures before accepting a horizontal swipe', () => {
  mount(); const surface = screen.getByTestId('gallery-swipe');
  function pointer(type: string, x: number, y: number) {
    fireEvent(surface, Object.assign(new Event(type, { bubbles: true }), { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y }));
  }
  pointer('pointerdown', 150, 100); pointer('pointercancel', 150, 100); pointer('pointerup', 30, 100);
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
  pointer('pointerdown', 150, 100); pointer('pointerup', 120, 10);
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].url);
  pointer('pointerdown', 150, 100); pointer('pointerup', 30, 100);
  expect(screen.getByRole('img')).toHaveAttribute('src', images[1].url);
});

it('keeps controls on image error and resets media state for a different product', () => {
  const view = mount(); fireEvent.error(screen.getByRole('img'));
  expect(screen.getByText('Ảnh mẫu minh họa')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ảnh tiếp theo' }));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[1].url);
  view.rerender(<ProductImageGallery images={[{ ...images[0], url: 'https://media.test/new.png' }, images[1]]} name="Sản phẩm mới" type="peanut" />);
  expect(screen.getByRole('img')).toHaveAttribute('src', 'https://media.test/new.png');
  expect(screen.getByRole('button', { name: 'Dừng tự động' })).toBeInTheDocument();
});
