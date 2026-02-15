export interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  onClick?: () => void;
}

// TODO: Add loading state with spinner animation
export function Button(props: ButtonProps) {
  const { label, variant = "primary", disabled = false, onClick } = props;
  const baseClass = "btn";
  const variantClass = `btn-${variant}`;

  return {
    type: "button" as const,
    className: `${baseClass} ${variantClass}`,
    disabled,
    onClick,
    label,
  };
}

// REVIEW: Consider using forwardRef for better ref handling
export function IconButton(props: {
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  return {
    type: "button" as const,
    className: "btn-icon",
    ariaLabel: props.label,
    onClick: props.onClick,
    icon: props.icon,
  };
}
