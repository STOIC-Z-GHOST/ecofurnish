import Logo from "../navbar/Logo";

export default function FooterBrand() {
  return (
    <div className="space-y-4">
      <Logo />

      <p className="max-w-sm text-sm leading-6 text-muted-foreground">
        Furniture made from recycled plastic and reclaimed wood, finished by hand in Addis Ababa.
      </p>
    </div>
  );
}