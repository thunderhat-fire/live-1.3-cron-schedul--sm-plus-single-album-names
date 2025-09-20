'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import ButtonSecondary from '@/shared/Button/ButtonSecondary';
import SectionHowItWork from '@/components/SectionHowItWork/SectionHowItWork';


export default function LandingPage() {
  const { data: session } = useSession();

  
  // Determine the appropriate destination for the "Get Started" button
  const getStartedHref = session?.user ? '/home-3' : '/signup';
  const getStartedText = session?.user ? 'Go to Platform' : 'Get Started';



  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-neutral-900 dark:text-white">VinylFunders<sup className="text-xs ml-0.5 align-super">™</sup></span>
          </div>
          <div className="flex items-center space-x-4">
            <ButtonPrimary href={getStartedHref} sizeClass="px-6 py-2">
              {getStartedText}
            </ButtonPrimary>
          </div>
        </div>
      </nav>



      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
                <span className="text-primary-600">Your Vinyl.</span>
                <br />
                Your Fans.
              </h1>
              <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
                Release your music on vinyl with zero risk. Upload, presale, and we handle the rest.
                <br />
                <span className="font-semibold text-green-400">100% no risk to creator.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <ButtonPrimary href="/home-3" sizeClass="px-8 py-4 text-lg">
                  Explore Platform
                </ButtonPrimary>
                <ButtonSecondary href="/upload-item" sizeClass="px-8 py-4 text-lg">
                  Start Your Presale
                </ButtonSecondary>
              </div>
            </div>
            
            {/* Image */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-lg">
                <Image
                  src="/LP.jpg"
                  alt="Vinyl Record"
                  width={500}
                  height={500}
                  className="rounded-lg shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Upload & Presale</h3>
            <p className="text-neutral-600 dark:text-neutral-300">
              Upload your music and start a presale campaign. Your fans pre-order, and we handle production.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Zero Risk</h3>
            <p className="text-neutral-600 dark:text-neutral-300">
              We only press vinyl when presale targets are met. No upfront costs, no inventory risk.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Live Streaming</h3>
            <p className="text-neutral-600 dark:text-neutral-300">
              Connect with your fans through live streaming. Build your audience and promote your releases.
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              What Artists Are Saying
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Join thousands of artists who have successfully brought their music to vinyl
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white">Mike Scott</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">A&R Manager</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 italic">
                "VinylFunders made record pressing easy and quick. The platform is incredibly easy to use, and my fans and clients love having physical copies of their music."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  R
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white">Rory Watts</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Techno Producer</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 italic">
                "Zero risk, maximum reward! I'm in the process of releasing my first vinyl album through VinylFunders. The ease of doing so is outstanding and the process is completely stress-free."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  X
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white">Xtransit</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Electronic Artist</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 italic">
                "The live streaming feature helped me build a community around my music. My vinyl presale is projected to sell out in 8 days, and I earned £750 from my first release!"
              </p>
            </div>
          </div>

          {/* Call to action within testimonials */}
          <div className="text-center mt-12">
            <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-6">
              Ready to join our community of successful artists?
            </p>
            <ButtonPrimary href="/signup" sizeClass="px-8 py-4 text-lg">
              Start Your Journey Today
            </ButtonPrimary>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-neutral-50 dark:bg-neutral-900 py-20">
        <div className="container mx-auto px-4">
          <SectionHowItWork />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-neutral-800 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">£260</div>
              <div className="text-neutral-600 dark:text-neutral-300">Average earnings per 100 records</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">£750</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">200 Records</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">£3000</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">500 Records</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
              <div className="text-neutral-600 dark:text-neutral-300">Risk-free guarantee</div>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-lg text-neutral-600 dark:text-neutral-300 font-medium">
              we do all pressing, packing and posting - to your Fans{' '}
              <a 
                href="/help-center" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-semibold transition-colors"
              >
                read FAQ
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
            Ready to Release Your Music on Vinyl?
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-8">
            Join artists who have successfully released their music on vinyl through our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ButtonPrimary href={getStartedHref} sizeClass="px-8 py-4 text-lg">
              {session?.user ? 'Go to Platform' : 'Start Your Journey'}
            </ButtonPrimary>
            <ButtonSecondary href="/search" sizeClass="px-8 py-4 text-lg">
              Explore More
            </ButtonSecondary>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-xl font-bold">VinylFunders<sup className="text-xs ml-0.5 align-super">™</sup></span>
          </div>
          <p className="text-neutral-400 mb-4">
            Your music. Your vinyl. Your success.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-neutral-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 