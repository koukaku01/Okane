class CurrencyConverter {
    constructor() {
        this.rates = {};
        this.previewCurrencies = new Set(['GBP', 'JPY', 'CAD']);
        this.baseCurrency = 'EUR';
        this.isUpdating = false;

        // List of supported currencies
        this.availableCurrencies = [
            'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW',
            'BGN', 'BRL', 'CZK', 'DKK', 'HKD', 'HUF', 'IDR', 'ILS', 'ISK', 'MXN',
            'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'ZAR'
        ];

        this.init();
    }

    init() {
        this.populateCurrencySelects();
        this.bindEvents();
        this.fetchRates();
    }

    populateCurrencySelects() {
        const fromSelect = document.getElementById('currency-from');
        const toSelect = document.getElementById('currency-to');

        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';

        this.availableCurrencies.forEach(code => {
            const optionFrom = document.createElement('option');
            optionFrom.value = code;
            optionFrom.textContent = code;
            if (code === 'EUR') optionFrom.selected = true;
            fromSelect.appendChild(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = code;
            optionTo.textContent = code;
            if (code === 'USD') optionTo.selected = true;
            toSelect.appendChild(optionTo);
        });
    }

    bindEvents() {
        const amountFrom = document.getElementById('amount-from');
        const amountTo = document.getElementById('amount-to');
        const currencyFrom = document.getElementById('currency-from');
        const currencyTo = document.getElementById('currency-to');
        const swapBtn = document.getElementById('swap-btn');
        const addBtn = document.getElementById('add-currency-btn');

        amountFrom.addEventListener('input', () => this.convertFromBase());
        amountTo.addEventListener('input', () => this.convertToBase());
        currencyFrom.addEventListener('change', () => this.onCurrencyChange());
        currencyTo.addEventListener('change', () => this.onCurrencyChange());
        swapBtn.addEventListener('click', () => this.swapCurrencies());
        addBtn.addEventListener('click', () => this.showAddCurrencyOptions());

        // Delete buttons
        const previewList = document.getElementById('preview-list');
        previewList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const item = e.target.closest('.preview-item');
                if (!item) return;
                const currency = item.dataset.currency;
                this.removeCurrency(currency);
            }
        });
    }

    async fetchRates() {
        try {
            const response = await fetch('https://api.frankfurter.dev/v1/latest');
            const data = await response.json();
            this.rates = { EUR: 1, ...data.rates };
            this.baseCurrency = data.base;
            this.updateLastUpdated();
            this.convertFromBase();
            this.hideError();
        } catch (error) {
            this.showError('Unable to fetch exchange rates');
            console.error('Error fetching rates:', error);
        }
    }

    convertFromBase() {
        if (this.isUpdating) return;
        this.isUpdating = true;

        const amount = parseFloat(document.getElementById('amount-from').value) || 0;
        const fromCurrency = document.getElementById('currency-from').value;
        const toCurrency = document.getElementById('currency-to').value;

        const convertedAmount = this.convert(amount, fromCurrency, toCurrency);
        document.getElementById('amount-to').value = convertedAmount.toFixed(2);

        this.updateRateDisplay(fromCurrency, toCurrency);
        this.updatePreview(amount, fromCurrency);

        setTimeout(() => { this.isUpdating = false; }, 10);
    }

    convertToBase() {
        if (this.isUpdating) return;
        this.isUpdating = true;

        const amount = parseFloat(document.getElementById('amount-to').value) || 0;
        const fromCurrency = document.getElementById('currency-from').value;
        const toCurrency = document.getElementById('currency-to').value;

        const convertedAmount = this.convert(amount, toCurrency, fromCurrency);
        document.getElementById('amount-from').value = convertedAmount.toFixed(2);

        this.updateRateDisplay(fromCurrency, toCurrency);
        this.updatePreview(convertedAmount, fromCurrency);

        setTimeout(() => { this.isUpdating = false; }, 10);
    }

    convert(amount, fromCurrency, toCurrency) {
        if (!this.rates[fromCurrency] || !this.rates[toCurrency]) return 0;

        const eurAmount = amount / this.rates[fromCurrency];
        return eurAmount * this.rates[toCurrency];
    }

    updateRateDisplay(from, to) {
        const rate = this.convert(1, from, to);
        document.getElementById('rate-display').textContent =
            `1 ${from} = ${rate.toFixed(4)} ${to}`;
    }

    updatePreview(amount, fromCurrency) {
        const previewList = document.getElementById('preview-list');

        this.previewCurrencies.forEach(currency => {
            const item = previewList.querySelector(`[data-currency="${currency}"]`);
            if (item) {
                const convertedAmount = this.convert(amount, fromCurrency, currency);
                const amountSpan = item.querySelector('.preview-amount');
                amountSpan.textContent = this.formatAmount(convertedAmount, currency);
            }
        });
    }

    formatAmount(amount, currency) {
        if (currency === 'JPY' || currency === 'KRW') {
            return Math.round(amount).toLocaleString();
        }
        return amount.toFixed(2);
    }

    swapCurrencies() {
        const fromSelect = document.getElementById('currency-from');
        const toSelect = document.getElementById('currency-to');
        const amountFrom = document.getElementById('amount-from');
        const amountTo = document.getElementById('amount-to');

        // Swap currencies
        const tempCurrency = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = tempCurrency;

        // Swap amounts
        const tempAmount = amountFrom.value;
        amountFrom.value = amountTo.value;
        amountTo.value = tempAmount;

        this.onCurrencyChange();
    }

    onCurrencyChange() {
        this.convertFromBase();
    }

    showAddCurrencyOptions() {
        const unusedCurrencies = this.availableCurrencies.filter(curr =>
            !this.previewCurrencies.has(curr) &&
            curr !== document.getElementById('currency-from').value &&
            curr !== document.getElementById('currency-to').value
        );

        if (unusedCurrencies.length === 0) {
            alert('All available currencies are already in use');
            return;
        }

        const selected = prompt(`Add currency to preview:\n${unusedCurrencies.join(', ')}\n\nEnter currency code:`);
        if (selected && unusedCurrencies.includes(selected.toUpperCase())) {
            this.addCurrency(selected.toUpperCase());
        }
    }

    addCurrency(currency) {
        this.previewCurrencies.add(currency);
        this.renderPreviewList();
        this.convertFromBase();
    }

    removeCurrency(currency) {
        this.previewCurrencies.delete(currency);
        this.renderPreviewList();
    }

    renderPreviewList() {
        const previewList = document.getElementById('preview-list');
        const amount = parseFloat(document.getElementById('amount-from').value) || 0;
        const fromCurrency = document.getElementById('currency-from').value;

        previewList.innerHTML = '';

        this.previewCurrencies.forEach(currency => {
            const convertedAmount = this.convert(amount, fromCurrency, currency);
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.dataset.currency = currency;
            item.innerHTML = `
            <span class="preview-code">${currency}</span>
            <span class="preview-name">${this.getShortCurrencyName(currency)}</span>
            <span class="preview-amount">${this.formatAmount(convertedAmount, currency)}</span>
            <button class="delete-btn">×</button>
        `;
            previewList.appendChild(item);
        });
    }

    getCurrencyName(code) {
        const names = {
            'USD': 'US Dollar',
            'EUR': 'Euro',
            'GBP': 'British Pound',
            'JPY': 'Japanese Yen',
            'CAD': 'Canadian Dollar',
            'AUD': 'Australian Dollar',
            'CHF': 'Swiss Franc',
            'CNY': 'Chinese Yuan',
            'INR': 'Indian Rupee',
            'KRW': 'South Korean Won',
            'BGN': 'Bulgarian Lev',
            'BRL': 'Brazilian Real',
            'CZK': 'Czech Koruna',
            'DKK': 'Danish Krone',
            'HKD': 'Hong Kong Dollar',
            'HUF': 'Hungarian Forint',
            'IDR': 'Indonesian Rupiah',
            'ILS': 'Israeli Shekel',
            'ISK': 'Icelandic Krona',
            'MXN': 'Mexican Peso',
            'MYR': 'Malaysian Ringgit',
            'NOK': 'Norwegian Krone',
            'NZD': 'New Zealand Dollar',
            'PHP': 'Philippine Peso',
            'PLN': 'Polish Zloty',
            'RON': 'Romanian Leu',
            'SEK': 'Swedish Krona',
            'SGD': 'Singapore Dollar',
            'THB': 'Thai Baht',
            'TRY': 'Turkish Lira',
            'ZAR': 'South African Rand'
        };
        return names[code] || code;
    }

    getShortCurrencyName(code) {
        const names = {
            'USD': 'Dollar',
            'EUR': 'Euro',
            'GBP': 'Pound',
            'JPY': 'Yen',
            'CAD': 'Dollar',
            'AUD': 'Dollar',
            'CHF': 'Franc',
            'CNY': 'Yuan',
            'INR': 'Rupee',
            'KRW': 'Won',
            'BGN': 'Lev',
            'BRL': 'Real',
            'CZK': 'Koruna',
            'DKK': 'Krone',
            'HKD': 'Dollar',
            'HUF': 'Forint',
            'IDR': 'Rupiah',
            'ILS': 'Shekel',
            'ISK': 'Krona',
            'MXN': 'Peso',
            'MYR': 'Ringgit',
            'NOK': 'Krone',
            'NZD': 'Dollar',
            'PHP': 'Peso',
            'PLN': 'Zloty',
            'RON': 'Leu',
            'SEK': 'Krona',
            'SGD': 'Dollar',
            'THB': 'Baht',
            'TRY': 'Lira',
            'ZAR': 'Rand'
        };
        return names[code] || code;
    }

    updateLastUpdated() {
        document.getElementById('last-updated').textContent =
            `Last updated: ${new Date().toLocaleTimeString()}`;
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        document.getElementById('error-message').style.display = 'none';
    }
}

// Initialize the converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});