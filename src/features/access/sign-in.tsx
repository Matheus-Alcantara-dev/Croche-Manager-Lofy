import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Page } from '@/components/layout';
import { Button, Card, Copy, Field, Heading, Notice, Row, Title } from '@/components/ui';
import { useAction } from '@/hooks/use-data';
import { adminPhone, customerPhone, demoPin, formatPhone } from '@/local/identity';
import { colors } from '@/theme';
import { useLocalSession } from './session';

export default function SignIn() {
  const { login, error } = useLocalSession();
  const [admin, setAdmin] = useState(false);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const action = useAction();
  return <Page narrow>
    <View style={styles.intro}>
      <View style={styles.mark}><Ionicons name="flower-outline" size={32} color={colors.accent} /></View>
      <Heading>Bem-vindo ao ateliê</Heading>
      <Copy muted>Entre para conhecer os projetos e fazer sua encomenda.</Copy>
    </View>
    <Card>
      <Title>{admin ? 'Entrada do administrador' : 'Entre com seu WhatsApp'}</Title>
      {!admin && <Copy muted>Seu perfil é criado automaticamente na primeira entrada.</Copy>}
      <Field key={admin ? 'admin' : 'client'} label="WhatsApp com DDD" value={phone} onChangeText={setPhone}
        keyboardType="phone-pad" autoComplete="tel" placeholder="(11) 90000-0000" maxLength={22} />
      {admin && <>
        <Field label="PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={4} />
        <Copy muted>PIN de demonstração: {demoPin}</Copy>
      </>}
      {!!(error || action.error) && <Notice error>{error || action.error}</Notice>}
      <Button label={action.busy ? 'Entrando…' : 'Entrar'} disabled={action.busy || !!error}
        onPress={() => void action.run(() => login(phone, admin ? pin : undefined))} />
      {!admin && <Button secondary label="Entrar como cliente de exemplo" disabled={action.busy || !!error}
        onPress={() => void action.run(() => login(customerPhone))} />}
    </Card>
    <Row>
      <Button secondary label={admin ? 'Voltar à entrada por WhatsApp' : 'Sou administrador'} disabled={action.busy}
        onPress={() => { setAdmin(!admin); setPhone(admin ? '' : formatPhone(adminPhone)); setPin(''); }} />
    </Row>
    <Copy muted>Demonstração local. Nenhum código é enviado por WhatsApp.</Copy>
  </Page>;
}

const styles = StyleSheet.create({
  intro: { gap: 8, alignItems: 'flex-start' },
  mark: { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.cream, justifyContent: 'center', alignItems: 'center' },
});
