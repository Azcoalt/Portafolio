import './galaxy.css';

/**
 * Componente GalaxyBackground:
 * Renderiza un fondo espacial dinámico y persistente con nebulosas,
 * 3 capas de estrellas titilantes y estrellas fugaces en puro CSS nativo.
 */
export const GalaxyBackground = () => {
  return (
    <div className="galaxy-bg" aria-hidden="true">
      <div className="galaxy-nebula" />
      <div className="galaxy-core" />
      <div className="galaxy-stars-small" />
      <div className="galaxy-stars-medium" />
      <div className="galaxy-stars-large" />
      <div className="galaxy-shooting-star" />
      <div className="galaxy-shooting-star" />
      <div className="galaxy-shooting-star" />
      <div className="galaxy-vignette" />
    </div>
  );
};
