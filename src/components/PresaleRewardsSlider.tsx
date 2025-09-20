"use client";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

export default function PresaleRewardsSlider() {
  return (
    <div className="max-w-lg mx-auto">
      <Swiper
        spaceBetween={20}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        modules={[Autoplay]}
        className="rounded-xl shadow-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm"
      >
        <SwiperSlide>
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-primary-700 dark:text-primary-300 mb-1">100 Records</span>
            <span className="text-3xl font-extrabold text-green-600 mb-1">£260</span>
            <span className="text-neutral-600 dark:text-neutral-300 text-sm">Artists like you earn per successful 100-record presale</span>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-primary-700 dark:text-primary-300 mb-1">200 Records</span>
            <span className="text-3xl font-extrabold text-green-600 mb-1">£750</span>
            <span className="text-neutral-600 dark:text-neutral-300 text-sm">Artists like you earn per successful 200-record presale</span>
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-primary-700 dark:text-primary-300 mb-1">500 Records</span>
            <span className="text-3xl font-extrabold text-green-600 mb-1">£3000</span>
            <span className="text-neutral-600 dark:text-neutral-300 text-sm">Artists like you earn per successful 500-record presale</span>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
} 