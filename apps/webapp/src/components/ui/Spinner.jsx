import { Loader2 } from 'lucide-react';

const Spinner = ({ className, style, size = 16, ...props }) => {
  return (
    <Loader2
      className={className}
      style={{
        width: size,
        height: size,
        animation: 'spin 1s linear infinite',
        ...style,
      }}
      {...props}
    />
  );
};

export default Spinner;
