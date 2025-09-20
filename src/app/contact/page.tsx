"use client";

import React, { useState } from "react";
import SocialsList from "@/shared/SocialsList/SocialsList";
import Label from "@/components/Label/Label";
import Input from "@/shared/Input/Input";
import Textarea from "@/shared/Textarea/Textarea";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import BackgroundSection from "@/components/BackgroundSection/BackgroundSection";
import SectionBecomeAnAuthor from "@/components/SectionBecomeAnAuthor/SectionBecomeAnAuthor";
import { toast } from "react-hot-toast";

const PageContact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });

  const info = [
    {
      title: "🗺️ ADDRESS",
      desc: "20-22 Wenlock Rd, London, N1 7GU",
    },
    {
      title: "💌 EMAIL",
      desc: "release@vinylfunders.com",
    },
    {
      title: "📞 PHONE",
      desc: "0044 20 4620 4408",
    },
    {
      title: "📞 PHONE (ALT)",
      desc: "0044 20 3627 4240",
    },
    {
      title: "📞 PHONE (ALT 2)",
      desc: "0044 20 8103 3480",
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.dismiss();
        toast.success("Message sent successfully!");
        setFormData({ fullName: "", email: "", message: "" });
      } else {
        toast.dismiss();
        toast.error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      toast.dismiss();
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`nc-PageContact overflow-hidden`}>
      <div className="">
        <h2 className="my-20 flex items-center text-3xl leading-[115%] md:text-5xl md:leading-[115%] font-semibold text-neutral-900 dark:text-neutral-100 justify-center">
          Contact
        </h2>
        <div className="container max-w-7xl mx-auto">
          <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-12 ">
            <div className="max-w-sm space-y-8">
              {info.map((item, index) => (
                <div key={index}>
                  <h3 className="uppercase font-semibold text-sm dark:text-neutral-200 tracking-wider">
                    {item.title}
                  </h3>
                  <span className="block mt-2 text-neutral-500 dark:text-neutral-400">
                    {item.desc}
                  </span>
                </div>
              ))}
              <div>
                <h3 className="uppercase font-semibold text-sm dark:text-neutral-200 tracking-wider">
                  🌏 SOCIALS
                </h3>
                <SocialsList className="mt-2" />
              </div>
            </div>
            <div>
              <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
                <label className="block">
                  <Label>Full name</Label>
                  <Input
                    name="fullName"
                    placeholder="Example Doe"
                    type="text"
                    className="mt-1"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label className="block">
                  <Label>Email address</Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="example@example.com"
                    className="mt-1"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label className="block">
                  <Label>Message</Label>
                  <Textarea
                    name="message"
                    className="mt-1"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <div>
                  <ButtonPrimary
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </ButtonPrimary>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* OTHER SECTIONS */}
      <div className="container mb-24 lg:mb-32">
        <hr className="border-t border-neutral-200 dark:border-neutral-700 my-24 lg:my-32" />
        <SectionBecomeAnAuthor />
      </div>
    </div>
  );
};

export default PageContact;
