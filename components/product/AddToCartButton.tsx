import { Check, ShoppingCart } from "lucide-react";

interface AddToCartButtonProps {
  onClick: () => void;
  /** Out of stock. */
  disabled?: boolean;
  /** Everything that's in stock is already in the cart. */
  maxed?: boolean;
  /** The saved cart hasn't loaded yet, so what's already in it is unknown. */
  loading?: boolean;
  /** A color/size still has to be chosen — shows this text and stays disabled. */
  prompt?: string;
}

export default function AddToCartButton({ onClick, disabled, maxed, loading, prompt }: AddToCartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || maxed || loading || !!prompt}
      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 font-medium text-white transition-all hover:bg-emerald-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
    >
      {maxed ? <Check size={18} /> : <ShoppingCart size={18} />}
      {prompt ? prompt : disabled ? "Out of Stock" : maxed ? "All in your cart" : "Add to Cart"}
    </button>
  );
}
