import { useEffect, useRef, useState } from "react";

const steps = [
  { target: "overview", title: "Meet NEXA", text: "A public AI experience for general questions, fictional task previews and browser voice. This tour does not make AI requests." },
  { target: "demo", title: "Choose how to explore", text: "Sample Demo returns fictional local answers. Live AI answers general questions and keeps a little recent context for follow-ups. Personal accounts stay disconnected." },
  { target: "demo", title: "Practise an interview", text: "In Live AI, choose Interview Practice, select a track and level, then Start practice. Answer one question at a time by typing or dictating. NEXA gives feedback and a next question." },
  { target: "architecture", title: "See the two public paths", text: "The connected cards show where local samples and Live AI answers come from. Expand the engineering layers if you want more detail." },
  { target: "security", title: "Stay in control", text: "Review dictated text before Send. You can stop speech or reset the conversation. Avoid sharing sensitive information, and treat AI answers and practice feedback as fallible." },
  { target: "faq", title: "You’re ready to try it", text: "The FAQ explains voice, short-term context and what NEXA cannot access. Close the tour, then head to Try NEXA to explore the controls yourself." },
];

export default function GuidedTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !dialog.current) return;
    const modal = dialog.current;
    if (!modal.open) modal.showModal();
    return () => {
      if (modal.open) modal.close();
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = document.getElementById(steps[step].target);
    if (!target) return;
    target.classList.add("tour-highlight");
    target.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    return () => target.classList.remove("tour-highlight");
  }, [open, step]);

  return <>
    <button ref={trigger} type="button" className="button secondary" onClick={() => { setStep(0); setOpen(true); }}>Take a guided tour <span>↗</span></button>
    <dialog ref={dialog} className="tour-dialog" aria-labelledby="tour-title" aria-describedby="tour-description" onClose={() => setOpen(false)}>
      <div className="tour-top"><span>NEXA TOUR · {step + 1} / {steps.length}</span><button type="button" aria-label="Close guided tour" onClick={() => setOpen(false)}>×</button></div>
      <div aria-live="polite" aria-atomic="true"><h2 id="tour-title">{steps[step].title}</h2><p id="tour-description">{steps[step].text}</p></div>
      <div className="tour-progress" aria-hidden="true">{steps.map((item, index) => <span key={item.title} className={index === step ? "current" : index < step ? "complete" : ""}/>)}</div>
      <div className="tour-actions"><button type="button" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>Back</button><button type="button" className="tour-next" onClick={() => step === steps.length - 1 ? setOpen(false) : setStep(value => Math.min(steps.length - 1, value + 1))}>{step === steps.length - 1 ? "Finish tour" : "Next"} →</button></div>
      <small>Close anytime or press Escape to try the page.</small>
    </dialog>
  </>;
}
