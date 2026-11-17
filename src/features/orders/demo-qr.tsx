import QRCode from 'qrcode';
import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

export function DemoQr({ value }: { value: string }) {
  const { path, canvas } = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const commands: string[] = [];
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(row, col)) commands.push('M' + (col + 4) + ' ' + (row + 4) + 'h1v1h-1z');
      }
    }
    return { path: commands.join(''), canvas: modules.size + 8 };
  }, [value]);

  return <View accessible accessibilityRole="image" accessibilityLabel="QR code Pix de teste"
    style={{ alignSelf: 'center', borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' }}>
    <Svg width={200} height={200} viewBox={'0 0 ' + canvas + ' ' + canvas}>
      <Rect width={canvas} height={canvas} fill="#fff" />
      <Path d={path} fill="#1b1918" />
    </Svg>
  </View>;
}
