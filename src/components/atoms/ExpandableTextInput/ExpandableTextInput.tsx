import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  FocusEvent,
  InputHTMLAttributes,
  KeyboardEvent,
} from "react";
import styles from "./ExpandableTextInput.module.scss";

type TextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> & {
  className?: string;
  onChange?: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
};

export const ExpandableTextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      className = "",
      onFocus,
      onBlur,
      onChange,
      value,
      defaultValue,
      style,
      placeholder,
      disabled,
      readOnly,
      ...inputRest
    },
    forwardedRef
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const popoverRef = useRef<HTMLTextAreaElement>(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const isControlled = typeof value !== "undefined";

    const toDisplayString = useCallback((candidate: unknown): string => {
      if (candidate === undefined || candidate === null) {
        return "";
      }
      if (Array.isArray(candidate)) {
        return candidate.join(", ");
      }
      return String(candidate);
    }, []);

    const [internalValue, setInternalValue] = useState(() => {
      if (isControlled) {
        return toDisplayString(value);
      }
      if (defaultValue !== undefined) {
        return toDisplayString(defaultValue);
      }
      return "";
    });

    useEffect(() => {
      if (isControlled) {
        setInternalValue(toDisplayString(value));
      }
    }, [isControlled, toDisplayString, value]);

    useEffect(() => {
      if (!isControlled && defaultValue !== undefined) {
        setInternalValue(toDisplayString(defaultValue));
      }
    }, [defaultValue, isControlled, toDisplayString]);

    useImperativeHandle(
      forwardedRef,
      () => inputRef.current as HTMLInputElement
    );

    const emitBlur = useCallback(
      (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (onBlur) {
          onBlur(event as unknown as FocusEvent<HTMLInputElement>);
        }
      },
      [onBlur]
    );

    const closePopover = useCallback(() => {
      setIsPopoverOpen(false);
    }, []);

    const handleInputFocus = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        setIsPopoverOpen(true);
        onFocus?.(event);
      },
      [onFocus]
    );

    const handleInputBlur = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!wrapperRef.current?.contains(nextTarget)) {
          closePopover();
          emitBlur(event);
        }
      },
      [closePopover, emitBlur]
    );

    const handleTextareaBlur = useCallback(
      (event: FocusEvent<HTMLTextAreaElement>) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!wrapperRef.current?.contains(nextTarget)) {
          closePopover();
          emitBlur(event);
        }
      },
      [closePopover, emitBlur]
    );

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!isControlled) {
          setInternalValue(event.target.value);
        }
        onChange?.(event);
      },
      [isControlled, onChange]
    );

    const handleBackdropMouseDown = useCallback(() => {
      if (popoverRef.current) {
        popoverRef.current.blur();
      } else if (inputRef.current) {
        inputRef.current.blur();
      }
    }, []);

    const handlePopoverKeyDown = useCallback(
      (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Escape") {
          event.preventDefault();
          popoverRef.current?.blur();
        }
      },
      []
    );

    useEffect(() => {
      if (isPopoverOpen && popoverRef.current) {
        requestAnimationFrame(() => {
          if (popoverRef.current) {
            const length = popoverRef.current.value.length;
            popoverRef.current.focus({ preventScroll: true });
            popoverRef.current.setSelectionRange(length, length);
          }
        });
      }
    }, [isPopoverOpen]);

    const inputClassName = `${styles.input}${className ? ` ${className}` : ""}`;

    return (
      <>
        <div className={styles.wrapper} ref={wrapperRef}>
          <input
            ref={inputRef}
            className={inputClassName}
            style={style}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            value={internalValue}
            {...inputRest}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onChange={handleChange}
          />
          {isPopoverOpen && (
            <div className={styles.popover} role="dialog" aria-modal="false">
              <textarea
                ref={popoverRef}
                className={styles.popoverInput}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                value={internalValue}
                onChange={handleChange}
                onBlur={handleTextareaBlur}
                onKeyDown={handlePopoverKeyDown}
              />
            </div>
          )}
        </div>
        {isPopoverOpen && (
          <div
            className={styles.backdrop}
            role="presentation"
            aria-hidden="true"
            onMouseDown={handleBackdropMouseDown}
          />
        )}
      </>
    );
  }
);

ExpandableTextInput.displayName = "ExpandableTextInput";
