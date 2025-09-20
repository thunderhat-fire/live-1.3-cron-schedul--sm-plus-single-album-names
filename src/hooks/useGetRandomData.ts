"use client";

import {
  _getPersonNameRd,
  defaultAvatar,
  imgHigtQualitys,
  _getImgRd,
  _getTagNameRd,
} from "@/contains/fakeData";

export default function useGetRandomData() {
  const getRandomPerson = () => ({
    id: String(Math.floor(Math.random() * 100)),
    name: _getPersonNameRd(),
    avatar: defaultAvatar,
  });

  const getRandomPost = () => ({
    id: String(Math.floor(Math.random() * 100)),
    author: getRandomPerson(),
    title: "Example Post",
    featuredImage: imgHigtQualitys[0],
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    date: new Date().toISOString(),
    href: "/blog-single",
    commentCount: Math.floor(Math.random() * 20),
    viewCount: Math.floor(Math.random() * 1000),
    readingTime: Math.floor(Math.random() * 10),
    bookmark: { count: Math.floor(Math.random() * 100), isBookmarked: false },
    like: { count: Math.floor(Math.random() * 100), isLiked: false },
    tags: [_getTagNameRd(), _getTagNameRd(), _getTagNameRd()],
  });

  return {
    getRandomPost,
    getRandomPerson,
  };
}
