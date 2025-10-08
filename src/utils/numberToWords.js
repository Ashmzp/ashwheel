export const numberToWords = (num) => {
  if (num === null || num === undefined) return '';
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen"
  ];

  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const toWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + toWords(n % 100) : "");
    if (n < 100000)
      return toWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + toWords(n % 1000) : "");
    if (n < 10000000)
      return toWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + toWords(n % 100000) : "");
    if (n < 1000000000)
        return toWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + toWords(n % 10000000) : "");
    return n.toString(); // fallback
  };

  const number = parseFloat(num).toFixed(2).split('.');
  const rupees = parseInt(number[0], 10);
  const paisa = parseInt(number[1], 10);

  let words = rupees > 0 ? toWords(rupees) + " Rupees" : "";
  
  if (paisa > 0) {
    if (words) {
      words += " and ";
    }
    words += toWords(paisa) + " Paisa";
  }

  return (words ? words : "Zero Rupees") + " Only";
};