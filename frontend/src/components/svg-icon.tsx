import React from 'react';

// Hàm import toàn bộ SVG
const importAll = (requireContext: __WebpackModuleApi.RequireContext) => {
  const list = requireContext.keys().map((key) => {
    const name = key.replace(/\.\/(.*)\.\w+$/, '$1'); // Lấy tên file SVG
    return { name, value: requireContext(key) }; // Đường dẫn SVG
  });
  return list;
};

let svgList: { name: string; value: string }[] = [];

try {
  // Import tất cả file SVG từ thư mục assets/svg
  svgList = importAll(require.context('assets/svg', true, /\.svg$/));
} catch (error) {
  console.warn(error);
  svgList = [];
}

// Props cho SvgIcon
interface IProps {
  name: string; // Tên SVG
  width: string | number; // Chiều rộng
  height?: string | number; // Chiều cao (tùy chọn)
  style?: React.CSSProperties; // Tùy chọn thêm style
  className?: string; // Thêm class nếu cần
  alt?: string; // Alt text
}

// SvgIcon Component
const SvgIcon: React.FC<IProps> = ({
  name,
  width,
  height,
  style,
  className,
  alt = '',
}) => {
  const svgItem = svgList.find((item) => item.name === name);

  if (!svgItem) {
    console.warn(`SVG with name "${name}" not found.`);
    return null;
  }
  return (
    <img
      src={svgItem.value}
      alt={alt}
      width={width}
      height={height}
      style={style}
      className={className}
    />
  );
};

export default SvgIcon;
