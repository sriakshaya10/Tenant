import { Outlet } from 'react-router-dom'
import { Logo } from './Logo'

// "Apartment building reflecting pink sky" by Tobias Wilden, Unsplash licence (free to use, no credit required).
// https://unsplash.com/photos/apartment-building-reflecting-pink-sky-4453DIQWtsQ
// Stored in public/images so the page works offline. The app's colour palette is taken from this photo.
const srcSet = '/images/login-building-1200.jpg 1200w, /images/login-building-2400.jpg 2400w'

export default function AuthLayout() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#2b2522]">
      <img
        src="/images/login-building-2400.jpg"
        srcSet={srcSet}
        sizes="100vw"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
      />
      {/* Darkens the open sky on the left so the logo stays legible; leaves the building clear. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-black/0" />

      <div className="relative flex min-h-[100dvh] flex-col px-6 py-6 sm:px-12 sm:py-8">
        <Logo className="text-white [&_path]:stroke-ink [&_rect]:fill-white" />

        <div className="flex flex-1 items-center py-10">
          <div className="w-full max-w-[400px] rounded-xl bg-canvas/95 p-7 shadow-pop backdrop-blur-sm sm:p-9">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
