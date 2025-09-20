'use client';

import Link from 'next/link';

export default function MasteringPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">MASTERING AND PREPARATION</h1>
      <p className="mb-4 text-lg text-neutral-700 dark:text-neutral-200">
        Welcome to the guide on mastering and preparing your music for vinyl! This page covers everything you need to know about the upload process and best practices for achieving the best sound on vinyl records.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">YOUR Responsibility for Digital Mastering</h2>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="mb-4 font-medium">
            <strong>YOU are responsible for the quality of the DIGITAL Master that you provide us with - that WE then subsequently Master for VINYL.</strong> These are two different processes.
          </p>
          <p className="mb-4">
            As part of Plus and Gold tiers you get 8 track credits that can be used for getting your basic mix mastered for Digital - which then can be uploaded onto the PresSale upload form.
          </p>
          <p className="mb-4">
            You should ensure that the tracks you submit are mastered for digital in .wav format when you upload them. We do offer a pay-as-you-go system to get your basic digital mix into a satisfactory Mastered state before you submit them.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">What is Mastering for Vinyl?</h2>
        <p>
          Mastering for vinyl is the process of preparing your final audio mix so it translates well to the physical limitations and unique characteristics of vinyl records. Unlike digital formats, vinyl has specific requirements for frequency range, stereo imaging, and dynamic range.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Why is it Important?</h2>
        <ul className="list-disc ml-6">
          <li>Vinyl records can distort or skip if the audio is not properly mastered.</li>
          <li>Low frequencies should be centered (mono) to avoid groove jumping.</li>
          <li>Excessive sibilance (&quot;s&quot; sounds) and high frequencies can cause distortion.</li>
          <li>Dynamic range should be controlled for a consistent listening experience.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Upload Process</h2>
        <ol className="list-decimal ml-6">
          <li>Prepare your audio files according to the guidelines below.</li>
          <li>
            <strong>Choose your path:</strong>
            <ul className="list-disc ml-6 mt-2">
              <li>If you require Digital mastering service - <Link href="/mastering-upload" className="text-primary-600 underline">go here</Link>.</li>
              <li>If you have digitally mastered your tracks for yourself - <Link href="/upload-item" className="text-primary-600 underline">go here and start an Album upload PreSale</Link>.</li>
            </ul>
          </li>
          <li>Follow the instructions to upload your tracks and provide metadata.</li>
          <li>Review your submission and confirm all details are correct.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">File Format & Technical Requirements</h2>
        <ul className="list-disc ml-6">
          <li><strong>Format:</strong> .WAV (16-bit or 24-bit, 44.1kHz or 48kHz)</li>
          <li><strong>Headroom:</strong> Leave at least -3dB of headroom (no clipping)</li>
          <li><strong>Mono Bass:</strong> Frequencies below 150Hz should be mono</li>
          <li><strong>Side Length:</strong> Max 18-22 minutes per side for best quality</li>
          <li><strong>Fade In/Out:</strong> Use gentle fades to avoid abrupt starts/ends</li>
          <li><strong>Metadata:</strong> Include track titles, artist name, and side info</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Tips for Best Results</h2>
        <ul className="list-disc ml-6">
          <li>Avoid excessive stereo width in low frequencies</li>
          <li>Control sibilance with a de-esser</li>
          <li>Use gentle compression and limiting</li>
          <li>Listen to reference vinyl records for comparison</li>
          <li>Consult with a professional mastering engineer if possible</li>
        </ul>
      </section>

      <div className="mt-10">
        <Link href="/" className="text-primary-600 underline">&larr; Back to Home</Link>
      </div>
    </div>
  );
} 