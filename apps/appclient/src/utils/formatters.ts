export const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const generateShortID = () => {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
};
