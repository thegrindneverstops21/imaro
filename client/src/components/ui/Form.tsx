import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type SubmitEvent,
} from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Issue = { field: HTMLElement; text: string; id: string };
const FormIssues = createContext<Issue[]>([]);

export function FieldError({ name }: { name: string }) {
  const issue = useContext(FormIssues).find(
    (item) => item.field.getAttribute("name") === name,
  );
  return issue ? <span className="field-error">{issue.text}</span> : null;
}

function labelFor(field: Field) {
  const labelled = field
    .getAttribute("aria-labelledby")
    ?.split(" ")
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");
  const label = field.labels?.[0]?.cloneNode(true) as HTMLElement | undefined;
  label
    ?.querySelectorAll("input, select, textarea, button, small, .field-error")
    .forEach((node) => node.remove());
  return (
    field.getAttribute("aria-label") ||
    labelled ||
    label?.textContent ||
    field.name ||
    "this field"
  )
    .replace(/\*/g, "")
    .trim()
    .toLowerCase();
}

function fieldError(field: Field): string {
  const label = labelFor(field);
  const value = field.value.trim();
  const validity = field.validity;
  if (validity.badInput) return `Please enter a valid ${label}.`;
  if (
    validity.valueMissing ||
    ((field.required || field.getAttribute("aria-required") === "true") &&
      !value)
  ) {
    return field.type === "checkbox"
      ? "Please agree to the policy before continuing."
      : `Please ${field.tagName === "SELECT" ? "choose" : "enter"} ${label}.`;
  }
  if (!value) return "";
  if (
    field.type === "email" &&
    (validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
  )
    return "Please enter an email address like name@example.com.";
  if (
    field.type === "tel" &&
    (!/^\+?[\d\s().-]+$/.test(value) || value.replace(/\D/g, "").length < 5)
  )
    return "Please enter a phone number using digits and an optional country code, such as +27 82 123 4567.";
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement
  ) {
    if (field.minLength > 0 && field.value.length < field.minLength)
      return `Please use at least ${field.minLength} characters for ${label}.`;
    if (field.maxLength > 0 && field.value.length > field.maxLength)
      return `Please keep ${label} to ${field.maxLength} characters or fewer.`;
  }
  if (field instanceof HTMLInputElement) {
    if (validity.rangeUnderflow)
      return `Please choose ${label} ${field.type === "date" ? "on or after" : "of at least"} ${field.min}.`;
    if (validity.rangeOverflow)
      return `Please choose ${label} ${field.type === "date" ? "on or before" : "of no more than"} ${field.max}.`;
    if (validity.stepMismatch)
      return `Please enter ${label} in increments of ${field.step || "1"}.`;
  }
  if (validity.typeMismatch || validity.patternMismatch || validity.customError)
    return `Please check the format of ${label} and try again.`;
  return "";
}

/** Shared custom validation for native and HeroUI controls; never shows browser bubbles. */
export function Form({
  children,
  onSubmit,
  validationPresentation = "inline",
  ...props
}: ComponentProps<"form"> & {
  validationPresentation?: "inline" | "modal";
}) {
  const prefix = useId();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [modalIssues, setModalIssues] = useState<Issue[]>([]);
  const previous = useRef<Issue[]>([]);

  function validate(form: HTMLFormElement) {
    for (const issue of previous.current) {
      issue.field.removeAttribute("aria-invalid");
      const ids = (issue.field.getAttribute("aria-describedby") ?? "")
        .split(" ")
        .filter((id) => id && id !== issue.id);
      if (ids.length)
        issue.field.setAttribute("aria-describedby", ids.join(" "));
      else issue.field.removeAttribute("aria-describedby");
    }
    const found: Issue[] = [];
    function add(field: HTMLElement, text: string) {
      if (text)
        found.push({ field, text, id: `${prefix}-error-${found.length}` });
    }
    const fields = Array.from(
      form.querySelectorAll<Field>("input, select, textarea"),
    ).filter((field) => !field.matches(":disabled") && field.type !== "hidden");
    fields.forEach((field) => add(field, fieldError(field)));
    const dates = fields.filter((field) => field.type === "date");
    if (dates.length === 2 && dates.every((field) => field.value)) {
      const nights =
        (Date.parse(dates[1].value) - Date.parse(dates[0].value)) / 86400000;
      if (nights <= 0)
        add(dates[1], "Please choose a check-out date after check-in.");
      else if (nights > 30)
        add(dates[1], "Please choose a stay of 30 nights or fewer.");
    }
    const pickers = Array.from(
      form.querySelectorAll<HTMLButtonElement>("[data-date-label]"),
    );
    for (const picker of pickers) {
      const value = picker.dataset.dateValue;
      if (!value)
        add(
          picker,
          `Please enter your ${picker.dataset.dateLabel?.toLowerCase()} date.`,
        );
      else if (
        value &&
        picker.dataset.dateMin &&
        value < picker.dataset.dateMin
      )
        add(
          picker,
          `Please choose ${picker.dataset.dateLabel?.toLowerCase()} on or after ${picker.dataset.dateMin}.`,
        );
    }
    if (
      pickers.length === 2 &&
      pickers.every((picker) => picker.dataset.dateValue)
    ) {
      const nights =
        (Date.parse(pickers[1].dataset.dateValue!) -
          Date.parse(pickers[0].dataset.dateValue!)) /
        86400000;
      if (nights <= 0)
        add(pickers[1], "Please choose a check-out date after check-in.");
      else if (nights > 30)
        add(pickers[1], "Please choose a stay of 30 nights or fewer.");
    }
    for (const issue of found) {
      issue.field.setAttribute("aria-invalid", "true");
      issue.field.setAttribute(
        "aria-describedby",
        `${issue.field.getAttribute("aria-describedby") ?? ""} ${issue.id}`.trim(),
      );
    }
    previous.current = found;
    setIssues(found);
    if (!found.length) setModalIssues([]);
    return found;
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    const found = validate(event.currentTarget);
    if (found.length) {
      event.preventDefault();
      if (validationPresentation === "modal") setModalIssues(found);
      else found[0].field.focus();
      return;
    }
    onSubmit?.(event);
  }

  return (
    <form
      {...props}
      noValidate
      onSubmit={submit}
      onInputCapture={(event) => {
        props.onInputCapture?.(event);
        if (previous.current.length) validate(event.currentTarget);
      }}
    >
      <FormIssues.Provider value={issues}>{children}</FormIssues.Provider>
      {issues.length > 0 && validationPresentation === "inline" && (
        <div className="form-validation" role="alert">
          <p>Please check the following details:</p>
          <ul>
            {issues.map((issue) => (
              <li key={issue.id} id={issue.id}>
                <button type="button" onClick={() => issue.field.focus()}>
                  {issue.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Modal
        isOpen={modalIssues.length > 0}
        onOpenChange={(open) => {
          if (!open) setModalIssues([]);
        }}
        placement="center"
        size="sm"
        classNames={{ base: "form-validation-modal" }}
      >
        <ModalContent>
          <ModalHeader>Please check your details</ModalHeader>
          <ModalBody>
            <p className="form-validation-modal-intro">
              Please correct the following before continuing:
            </p>
            <ul className="form-validation-modal-list">
              {modalIssues.map((issue) => (
                <li key={issue.id}>{issue.text}</li>
              ))}
            </ul>
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              className="button"
              onClick={() => {
                setModalIssues([]);
                modalIssues[0]?.field.focus();
              }}
            >
              Return to form
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </form>
  );
}
