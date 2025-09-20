"use client";
import React, { FC, useEffect, useRef, useState } from "react";
import { RadioGroup } from "@/app/headlessui";
import Textarea from "@/shared/Textarea/Textarea";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import ButtonSecondary from "@/shared/Button/ButtonSecondary";
import NcModal from "@/shared/NcModal/NcModal";

export interface ProblemPlan {
  name: string;
  id: string;
  label: string;
}

export interface ModalReportItemProps {
  show: boolean;
  problemPlans?: ProblemPlan[];
  onCloseModalReportItem: () => void;
  nftId: string;
}

const problemPlansDemo = [
  { name: "Violence", id: "Violence", label: "Violence" },
  { name: "Trouble", id: "Trouble", label: "Trouble" },
  { name: "Spam", id: "Spam", label: "Spam" },
  { name: "Other", id: "Other", label: "Other" },
];

const ModalReportItem: FC<ModalReportItemProps> = ({
  problemPlans = problemPlansDemo,
  show,
  onCloseModalReportItem,
  nftId,
}) => {
  const textareaRef = useRef(null);
  const [problemSelected, setProblemSelected] = useState(problemPlans[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (show) {
      setTimeout(() => {
        const element: HTMLTextAreaElement | null = textareaRef.current;
        if (element) {
          (element as HTMLTextAreaElement).focus();
        }
      }, 400);
    }
    if (!show) {
      setMessage('');
      setError(null);
      setSuccess(false);
    }
  }, [show]);

  const handleClickSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!nftId) {
      setError('NFT reference is required.');
      return;
    }
    if (!message.trim()) {
      setError('Message is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/abuse-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: problemSelected.id,
          message,
          nftId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit report.');
      } else {
        setSuccess(true);
        setMessage('');
      }
    } catch (err) {
      setError('Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  const renderCheckIcon = () => {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx={12} cy={12} r={12} fill="#fff" opacity="0.2" />
        <path
          d="M7 13l3 3 7-7"
          stroke="#fff"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const renderContent = () => {
    return (
      <form action="#" onSubmit={handleClickSubmitForm}>
        {/* RADIO PROBLEM PLANS */}
        <RadioGroup value={problemSelected} onChange={setProblemSelected}>
          <RadioGroup.Label className="sr-only">Problem Plans</RadioGroup.Label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {problemPlans.map((plan) => (
              <RadioGroup.Option
                key={plan.name}
                value={plan}
                className={({ checked }) => {
                  return `${
                    checked
                      ? "bg-primary-6000 text-white dark:bg-primary-700"
                      : "bg-white dark:bg-black/20 border-t dark:border-0 border-neutral-50 "
                  } relative shadow-lg rounded-lg px-3 py-3 cursor-pointer flex sm:px-5 sm:py-4 focus:outline-none `;
                }}
              >
                {({ checked }) => (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <RadioGroup.Label
                          as="p"
                          className={`font-medium line-clamp-1 ${
                            checked
                              ? "text-white"
                              : "text-neutral-900 dark:text-white"
                          }`}
                        >
                          {plan.label}
                        </RadioGroup.Label>
                      </div>
                    </div>
                    {checked && (
                      <div className="flex-shrink-0 text-white">
                        {renderCheckIcon()}
                      </div>
                    )}
                  </div>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>

        {/* TEXAREA MESSAGER */}
        <div className="mt-4">
          <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200">
            Message
          </h4>
          <span className="text-sm text-neutral-6000 dark:text-neutral-400">
            Please provide any additional information or context that will help
            us understand and handle the situation.
          </span>
          <Textarea
            placeholder="..."
            className="mt-3"
            ref={textareaRef}
            required={true}
            rows={4}
            id="report-message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={loading}
          />
        </div>
        {error && <div className="mt-2 text-red-500">{error}</div>}
        {success && <div className="mt-2 text-green-600">Report submitted successfully!</div>}
        <div className="mt-4 space-x-3">
          <ButtonPrimary type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </ButtonPrimary>
          <ButtonSecondary type="button" onClick={onCloseModalReportItem} disabled={loading}>
            Cancel
          </ButtonSecondary>
        </div>
      </form>
    );
  };

  const renderTrigger = () => {
    return null;
  };

  return (
    <NcModal
      isOpenProp={show}
      onCloseModal={onCloseModalReportItem}
      contentExtraClass="max-w-screen-md"
      renderContent={renderContent}
      renderTrigger={renderTrigger}
      modalTitle="Report Abuse"
    />
  );
};

export default ModalReportItem;
