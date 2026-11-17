const images: Record<string, number> = {
  'exemplo:caramelo': require('../../assets/images/products/caramelo.jpeg'),
  'exemplo:girassol': require('../../assets/images/products/girassol.jpeg'),
  'exemplo:lavanda': require('../../assets/images/products/lavanda.jpeg'),
  'exemplo:azul': require('../../assets/images/products/azul.jpeg'),
  'exemplo:areia': require('../../assets/images/products/areia.jpeg'),
  'exemplo:lilas': require('../../assets/images/products/lilas.jpeg'),
};

export function localPhoto(path: string) {
  return images[path] ?? (path.startsWith('data:image/') ? { uri: path } : undefined);
}
