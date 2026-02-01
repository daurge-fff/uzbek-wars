/**
 * Color Palette Component
 * 
 * Displays the Uzbek cultural color palette for visual verification
 * This component is used for testing and documentation purposes
 */

interface ColorSwatchProps {
  name: string;
  colorClass: string;
  textColorClass?: string;
}

const ColorSwatch = ({ name, colorClass, textColorClass = 'text-white' }: ColorSwatchProps) => (
  <div className="flex flex-col items-center">
    <div className={`w-20 h-20 rounded-lg ${colorClass} ${textColorClass} flex items-center justify-center text-xs font-semibold shadow-md`}>
      {name}
    </div>
    <span className="text-xs mt-2 text-text-secondary">{name}</span>
  </div>
);

export const ColorPalette = () => {
  return (
    <div className="p-6 bg-background-primary min-h-screen">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Uzbek Wars Color Palette</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Primary Colors</h2>
        <div className="flex gap-4 flex-wrap">
          <ColorSwatch name="Primary" colorClass="bg-primary" />
          <ColorSwatch name="Primary Light" colorClass="bg-primary-light" />
          <ColorSwatch name="Primary Dark" colorClass="bg-primary-dark" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Secondary Colors</h2>
        <div className="flex gap-4 flex-wrap">
          <ColorSwatch name="Secondary" colorClass="bg-secondary" />
          <ColorSwatch name="Secondary Light" colorClass="bg-secondary-light" />
          <ColorSwatch name="Secondary Dark" colorClass="bg-secondary-dark" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Accent Colors</h2>
        <div className="flex gap-4 flex-wrap">
          <ColorSwatch name="Accent" colorClass="bg-accent" />
          <ColorSwatch name="Accent Light" colorClass="bg-accent-light" />
          <ColorSwatch name="Accent Dark" colorClass="bg-accent-dark" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Background Colors</h2>
        <div className="flex gap-4 flex-wrap">
          <ColorSwatch name="BG Primary" colorClass="bg-background-primary border border-gray-300" textColorClass="text-text-primary" />
          <ColorSwatch name="BG Secondary" colorClass="bg-background-secondary border border-gray-300" textColorClass="text-text-primary" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Text Colors</h2>
        <div className="flex gap-4 flex-wrap">
          <ColorSwatch name="Text Primary" colorClass="bg-text-primary" />
          <ColorSwatch name="Text Secondary" colorClass="bg-text-secondary" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Status Colors</h2>
        <div className="flex gap-4 flex-wrap">
          <ColorSwatch name="Success" colorClass="bg-success" />
          <ColorSwatch name="Danger" colorClass="bg-danger" />
          <ColorSwatch name="Warning" colorClass="bg-warning" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Typography</h2>
        <div className="space-y-2">
          <h1 className="text-text-primary">H1 - 2rem (32px) - Bold</h1>
          <h2 className="text-text-primary">H2 - 1.5rem (24px) - Semibold</h2>
          <h3 className="text-text-primary">H3 - 1.25rem (20px) - Semibold</h3>
          <p className="text-text-primary">Paragraph - 1rem (16px) - Regular</p>
          <small className="text-text-secondary">Small - 0.875rem (14px) - Regular</small>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="btn-primary">Primary Button</button>
          <button className="btn-secondary">Secondary Button</button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Mobile-First Breakpoints</h2>
        <div className="space-y-2 text-text-secondary">
          <p>xs: 375px (Extra small phones)</p>
          <p>sm: 640px (Small phones)</p>
          <p>md: 768px (Tablets)</p>
          <p>lg: 1024px (Desktop)</p>
          <p>xl: 1280px (Large desktop)</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Touch Targets</h2>
        <div className="flex gap-4">
          <button className="min-h-touch min-w-touch bg-primary text-white rounded-lg">
            44x44px
          </button>
          <p className="text-text-secondary self-center">Minimum touch target size for mobile accessibility</p>
        </div>
      </section>
    </div>
  );
};
