"use client";

// A plain <button type="submit"> inside a server-action <form>, guarded by
// a native confirm() — for actions consequential enough that the app's
// usual bare submit button (see delete-user) isn't enough on its own.
export function ConfirmSubmitButton({
  confirmMessage,
  children,
  className,
  style,
}: {
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
