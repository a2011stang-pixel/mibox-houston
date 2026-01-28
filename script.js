// Pricing Configuration
const PRICING = {
    delivery: {
        zone1: { fee: 79, zips: ['77002','77003','77004','77005','77006','77007','77008','77009','77010','77011','77012','77013','77014','77015','77016','77017','77018','77019','77020','77021','77022','77023','77024','77025','77026','77027','77028','77029','77030','77031','77032','77033','77034','77035','77036','77037','77038','77039','77040','77041','77042','77043','77044','77045','77046','77047','77048','77049','77050','77051','77053','77054','77055','77056','77057','77058','77059','77060','77061','77062','77063','77064','77065','77066','77067','77068','77069','77070','77071','77072','77073','77074','77075','77076','77077','77078','77079','77080','77081','77082','77083','77084','77085','77086','77087','77088','77089','77090','77091','77092','77093','77094','77095','77096','77098','77099','77201','77336','77338','77339','77345','77346','77357','77373','77375','77377','77379','77380','77381','77382','77383','77384','77385','77386','77388','77389','77396','77401','77406','77407','77429','77433','77447','77449','77450','77477','77478','77479','77489','77493','77494','77498','77502','77503','77504','77505','77506','77520','77521','77530','77536','77546','77547','77571','77581','77584','77586','77587','77598'] },
        zone2: { fee: 99, zips: ['77301','77302','77303','77304','77306','77316','77318','77354','77356','77362','77365','77372','77378','77423','77441','77445','77446','77461','77464','77469','77471','77474','77476','77484','77485','77545','77573','77574','77578','77583','77588'] },
        zone3: { fee: 129, zips: ['77327','77328','77331','77355','77363','77368','77369','77514','77523','77532','77533','77535','77562','77565','77575','77577','77590','77591','77592','77597','77414','77415','77417','77418','77420','77422','77426','77430','77432','77435','77436','77437','77440','77442','77443','77444','77448','77451','77453','77454','77455','77456','77457','77458','77459','77463','77465','77466','77467','77468','77470','77473','77475','77480','77481','77482','77483','77486','77487','77488'] }
    },
    monthly: {
        '16': { onsite: 189, facilityInside: 249, facilityOutside: 199 },
        '20': { onsite: 229, facilityInside: 299, facilityOutside: 249 }
    },
    firstMonth: {
        '16': 119,
        '20': 149
    },
    pickup: {
        zone1: 79,
        zone2: 99,
        zone3: 129
    },
    taxRate: 0.0825
};

// Current quote data for webhook
let currentQuoteData = {};

// Get delivery zone from ZIP
function getDeliveryZone(zip) {
    if (PRICING.delivery.zone1.zips.includes(zip)) return 'zone1';
    if (PRICING.delivery.zone2.zips.includes(zip)) return 'zone2';
    if (PRICING.delivery.zone3.zips.includes(zip)) return 'zone3';
    return null;
}

// Calculate quote
function calculateQuote() {
    const serviceType = document.getElementById('serviceType').value;
    const containerSize = document.getElementById('containerSize').value;
    const deliveryZip = document.getElementById('deliveryZip').value;
    const destinationZip = document.getElementById('destinationZip').value;

    if (!serviceType || !deliveryZip) return null;

    const zone = getDeliveryZone(deliveryZip);
    if (!zone) {
        alert('Sorry, we do not currently serve that ZIP code. Please call us at (713) 929-6051 to discuss options.');
        return null;
    }

    let deliveryFee = PRICING.delivery[zone].fee;
    let firstMonthRent = PRICING.firstMonth[containerSize];
    let monthlyRent = 0;
    let pickupFee = 0;

    // Determine monthly rate based on service type
    if (serviceType === 'onsite') {
        monthlyRent = PRICING.monthly[containerSize].onsite;
        pickupFee = PRICING.pickup[zone];
    } else if (serviceType === 'facility-inside') {
        monthlyRent = PRICING.monthly[containerSize].facilityInside;
        pickupFee = 0; // Free pickup for facility storage
    } else if (serviceType === 'facility-outside') {
        monthlyRent = PRICING.monthly[containerSize].facilityOutside;
        pickupFee = 0; // Free pickup for facility storage
    } else if (serviceType === 'moving-direct') {
        monthlyRent = PRICING.monthly[containerSize].onsite;
        const destZone = getDeliveryZone(destinationZip);
        if (destZone) {
            pickupFee = PRICING.delivery[destZone].fee; // Destination delivery fee
        }
    } else if (serviceType === 'moving-facility') {
        monthlyRent = PRICING.monthly[containerSize].facilityInside;
        const destZone = getDeliveryZone(destinationZip);
        if (destZone) {
            pickupFee = PRICING.delivery[destZone].fee;
        }
    }

    // Calculate totals
    const subtotalToday = deliveryFee + firstMonthRent;
    const taxToday = subtotalToday * PRICING.taxRate;
    const dueToday = subtotalToday + taxToday;

    const taxMonthly = monthlyRent * PRICING.taxRate;
    const ongoingMonthly = monthlyRent + taxMonthly;

    const taxPickup = pickupFee * PRICING.taxRate;
    const dueWhenDone = pickupFee + taxPickup;

    return {
        deliveryFee,
        firstMonthRent,
        monthlyRent,
        pickupFee,
        taxToday,
        taxMonthly,
        taxPickup,
        dueToday,
        ongoingMonthly,
        dueWhenDone,
        zone
    };
}

// Format currency
function formatCurrency(amount) {
    return '$' + amount.toFixed(2);
}

// Set button loading state
function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        const spinnerHTML = '<span class="btn-spinner"></span>';
        button.innerHTML = spinnerHTML + 'Processing...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText;
    }
}

// Initialize form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Show/hide destination ZIP based on service type
    document.getElementById('serviceType').addEventListener('change', function() {
        const destGroup = document.getElementById('destinationZipGroup');
        const destInput = document.getElementById('destinationZip');

        if (this.value.includes('moving')) {
            destGroup.style.display = 'block';
            destInput.required = true;
        } else {
            destGroup.style.display = 'none';
            destInput.required = false;
            destInput.value = ''; // Clear destination ZIP when not needed
        }
    });

    // Quote form submission
    document.getElementById('quoteCalculator').addEventListener('submit', function(e) {
        e.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');
        setButtonLoading(submitBtn, true);

        // Simulate brief processing delay for UX
        setTimeout(function() {
            const quote = calculateQuote();
            setButtonLoading(submitBtn, false);

            if (!quote) return;

            // Update display - totals
            document.getElementById('dueToday').textContent = formatCurrency(quote.dueToday);
            document.getElementById('ongoingMonthly').textContent = formatCurrency(quote.ongoingMonthly);
            document.getElementById('dueWhenDone').textContent = formatCurrency(quote.dueWhenDone);

            // Update display - itemized breakdown
            document.getElementById('deliveryFeeDisplay').textContent = formatCurrency(quote.deliveryFee);
            document.getElementById('firstMonthDisplay').textContent = formatCurrency(quote.firstMonthRent);
            document.getElementById('taxTodayDisplay').textContent = formatCurrency(quote.taxToday);
            document.getElementById('monthlyRentDisplay').textContent = formatCurrency(quote.monthlyRent);
            document.getElementById('taxMonthlyDisplay').textContent = formatCurrency(quote.taxMonthly);
            document.getElementById('pickupFeeDisplay').textContent = formatCurrency(quote.pickupFee);
            document.getElementById('taxPickupDisplay').textContent = formatCurrency(quote.taxPickup);

            // Store quote data for webhook
            currentQuoteData = {
                serviceType: document.getElementById('serviceType').value,
                containerSize: document.getElementById('containerSize').value,
                deliveryZip: document.getElementById('deliveryZip').value,
                destinationZip: document.getElementById('destinationZip').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                deliveryFee: quote.deliveryFee,
                firstMonthRent: quote.firstMonthRent,
                monthlyRent: quote.monthlyRent,
                pickupFee: quote.pickupFee,
                taxToday: quote.taxToday,
                dueToday: quote.dueToday,
                ongoingMonthly: quote.ongoingMonthly,
                dueWhenDone: quote.dueWhenDone
            };

            // Show results and booking form
            document.getElementById('quoteResults').classList.add('show');
            document.getElementById('bookingForm').classList.add('show');

            // Scroll to quote results so user sees full quote and "Ready to Book" CTA
            setTimeout(function() {
                document.getElementById('quoteResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

            // Set minimum delivery date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('deliveryDate').min = tomorrow.toISOString().split('T')[0];

            // Send quote to webhooks
            sendToWebhook('quote');
        }, 300);
    });

    // Booking submission
    document.getElementById('submitBooking').addEventListener('click', function() {
        const form = document.getElementById('bookingForm');
        const requiredFields = form.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach(field => {
            if (!field.value) {
                field.classList.add('is-invalid');
                valid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        if (!valid) {
            alert('Please fill in all required fields.');
            return;
        }

        const submitBtn = this;
        setButtonLoading(submitBtn, true);

        // Add booking data
        currentQuoteData.company = document.getElementById('company').value;
        currentQuoteData.deliveryAddress = document.getElementById('deliveryAddress').value;
        currentQuoteData.containerPlacement = document.getElementById('containerPlacement').value;
        currentQuoteData.deliveryDate = document.getElementById('deliveryDate').value;
        currentQuoteData.doorFacing = document.querySelector('input[name="doorFacing"]:checked').value;
        currentQuoteData.gateCode = document.getElementById('gateCode').value;
        currentQuoteData.howHeard = document.getElementById('howHeard').value;
        currentQuoteData.notes = document.getElementById('notes').value;
        currentQuoteData.bookingSubmitted = true;

        // Send to webhook
        sendToWebhook('booking');

        // Show success message after brief delay
        setTimeout(function() {
            setButtonLoading(submitBtn, false);
            document.getElementById('bookingForm').classList.remove('show');
            document.getElementById('bookingSuccess').classList.add('show');
        }, 500);
    });
});

// Send data to Zapier and Stella webhooks
function sendToWebhook(type) {
    const zapierUrl = 'https://hooks.zapier.com/hooks/catch/21414077/2axrkxs/';
    const stellaUrl = 'https://api.runstella.com/webhook/16216eb0';

    const data = {
        ...currentQuoteData,
        formType: type,
        timestamp: new Date().toISOString(),
        source: 'miboxhouston.com'
    };

    // Send to Zapier
    fetch(zapierUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).catch(err => console.log('Zapier webhook error:', err));

    // Send to Stella
    fetch(stellaUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).catch(err => console.log('Stella webhook error:', err));
}
