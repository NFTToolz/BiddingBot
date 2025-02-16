import ButtonSvg from "@/assets/svg/ButtonSvg";

const Button = ({
  className,
  href,
  onClick,
  children,
  px,
  white,
}: IButtonProps) => {
  const classes = `button relative inline-flex items-center justify-center h-11 transition-colors hover:text-color-1 ${
    px || "px-7"
  } ${white ? "text-n-8" : "text-[#FFFFFF]"} ${className || ""}`;
  const spanClasses = "relative z-10";

  const renderButton = () => (
    <button className={classes} onClick={onClick}>
      <span className={spanClasses}>{children}</span>
      {ButtonSvg(white)}
    </button>
  );

  const renderLink = () => (
    <a href={href} className={classes}>
      <span className={spanClasses}>{children}</span>
      {ButtonSvg(white)}
    </a>
  );

  return href ? renderLink() : renderButton();
};

export default Button;

interface IButtonProps {
  className?: string;
  href?: string;
  onClick?: () => void;
  children: any;
  px?: string;
  white?: boolean;
}
