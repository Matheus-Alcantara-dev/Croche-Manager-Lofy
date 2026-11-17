const messages: Record<string, string> = {
  '23503': 'Este registro está vinculado a outros dados do ateliê.',
  '23505': 'Já existe um registro com esses dados.',
  '23514': 'Confira os campos e as regras deste registro.',
  '42501': 'Você não tem permissão para concluir esta operação.',
  invalid_credentials: 'O e-mail ou a senha estão incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  over_email_send_rate_limit: 'Aguarde alguns minutos antes de pedir outro e-mail.',
  weak_password: 'Escolha uma senha mais forte.',
};

export function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return messages[error.code] ?? 'Não foi possível concluir a operação. Tente novamente.';
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação. Tente novamente.';
}
