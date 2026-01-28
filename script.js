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

// Service type display names
const SERVICE_NAMES = {
    'onsite': 'Store at My Property',
    'facility-inside': 'Store at MI-BOX (Climate Controlled)',
    'facility-outside': 'Store at MI-BOX (Outside)',
    'moving-direct': 'Moving (Property to Property)',
    'moving-facility': 'Moving (via MI-BOX Facility)'
};

// Current wizard state
let currentStep = 1;
let quoteData = {};
let turnstileToken = null;

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
    if (!zone) return null;

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
        pickupFee = 0;
    } else if (serviceType === 'facility-outside') {
        monthlyRent = PRICING.monthly[containerSize].facilityOutside;
        pickupFee = 0;
    } else if (serviceType === 'moving-direct') {
        monthlyRent = PRICING.monthly[containerSize].onsite;
        const destZone = getDeliveryZone(destinationZip);
        if (destZone) {
            pickupFee = PRICING.delivery[destZone].fee;
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

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// Scroll to the top of the quote form card
function scrollToForm() {
    var formCard = document.querySelector('.quote-card');
    if (formCard) {
        // Use smooth scroll with a small offset for better visibility
        var headerOffset = 20;
        var elementPosition = formCard.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Navigate to step
function goToStep(step) {
    // Update progress indicators
    document.querySelectorAll('.wizard-step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 < step) {
            el.classList.add('completed');
        } else if (index + 1 === step) {
            el.classList.add('active');
        }
    });

    // Update panels
    document.querySelectorAll('.wizard-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    const targetPanel = document.getElementById('step' + step);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    currentStep = step;

    // If going to step 3, calculate and display quote
    if (step === 3) {
        displayQuoteSummary();
    }

    // If going to step 4, pre-populate the ZIP from step 1
    if (step === 4) {
        document.getElementById('deliveryZipConfirm').value = document.getElementById('deliveryZip').value;
    }

    // Scroll to top of form so user sees the new step
    scrollToForm();
}

// Display quote summary on step 3
function displayQuoteSummary() {
    const serviceType = document.getElementById('serviceType').value;
    const containerSize = document.getElementById('containerSize').value;
    const deliveryZip = document.getElementById('deliveryZip').value;
    const deliveryDate = document.getElementById('deliveryDate').value;

    // Update summary info
    document.getElementById('summaryService').textContent = SERVICE_NAMES[serviceType] || '--';
    document.getElementById('summaryContainer').textContent = containerSize === '16' ? "8' x 16'" : "8' x 20'";
    document.getElementById('summaryDate').textContent = formatDate(deliveryDate);
    document.getElementById('summaryZip').textContent = deliveryZip;

    // Calculate quote
    const quote = calculateQuote();
    if (!quote) return;

    // Update Due Today box
    document.getElementById('tableDeliveryFee').textContent = formatCurrency(quote.deliveryFee);
    document.getElementById('tableFirstMonth').textContent = formatCurrency(quote.firstMonthRent);
    document.getElementById('tableTaxToday').textContent = formatCurrency(quote.taxToday);
    document.getElementById('tableDueToday').textContent = formatCurrency(quote.dueToday);

    // Update Ongoing Monthly box
    document.getElementById('tableMonthlyRent').textContent = formatCurrency(quote.monthlyRent);
    document.getElementById('tableMonthlyTax').textContent = formatCurrency(quote.taxMonthly);
    document.getElementById('tableMonthlyTotal').textContent = formatCurrency(quote.ongoingMonthly);

    // Update When Finished box
    document.getElementById('tablePickupFee').textContent = quote.pickupFee > 0 ? formatCurrency(quote.pickupFee) : 'FREE';
    document.getElementById('tablePickupTax').textContent = quote.pickupFee > 0 ? formatCurrency(quote.taxPickup) : '$0.00';
    document.getElementById('tablePickupTotal').textContent = quote.pickupFee > 0 ? formatCurrency(quote.dueWhenDone) : 'FREE';

    // Store quote data
    quoteData = {
        serviceType,
        containerSize,
        deliveryZip,
        destinationZip: document.getElementById('destinationZip').value,
        deliveryDate,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        howHeard: document.getElementById('howHeard').value,
        ...quote
    };
}

// Validate step fields
function validateStep(step) {
    let isValid = true;
    let firstInvalid = null;

    if (step === 1) {
        const fields = ['serviceType', 'deliveryZip', 'containerSize', 'deliveryDate'];
        const serviceType = document.getElementById('serviceType').value;

        // Add destination ZIP if moving
        if (serviceType.includes('moving')) {
            fields.push('destinationZip');
        }

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value) {
                field.classList.add('is-invalid');
                isValid = false;
                if (!firstInvalid) firstInvalid = field;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        // Validate ZIP code is in service area
        const deliveryZip = document.getElementById('deliveryZip').value;
        if (deliveryZip && !getDeliveryZone(deliveryZip)) {
            document.getElementById('deliveryZip').classList.add('is-invalid');
            alert('Sorry, we do not currently serve that ZIP code. Please call us at (713) 929-6051 to discuss options.');
            isValid = false;
        }

        // Validate destination ZIP if moving
        if (serviceType.includes('moving')) {
            const destZip = document.getElementById('destinationZip').value;
            if (destZip && !getDeliveryZone(destZip)) {
                document.getElementById('destinationZip').classList.add('is-invalid');
                alert('Sorry, we do not currently serve the destination ZIP code. Please call us at (713) 929-6051 to discuss options.');
                isValid = false;
            }
        }

    } else if (step === 2) {
        const fields = ['firstName', 'email', 'phone'];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value) {
                field.classList.add('is-invalid');
                isValid = false;
                if (!firstInvalid) firstInvalid = field;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        // Validate email format
        const email = document.getElementById('email');
        if (email.value && !email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            email.classList.add('is-invalid');
            isValid = false;
            if (!firstInvalid) firstInvalid = email;
        }
    } else if (step === 4) {
        const fields = ['deliveryAddress', 'deliveryCity', 'placementLocation', 'surfaceType'];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value) {
                field.classList.add('is-invalid');
                isValid = false;
                if (!firstInvalid) firstInvalid = field;
            } else {
                field.classList.remove('is-invalid');
            }
        });
    }

    if (firstInvalid) {
        firstInvalid.focus();
    }

    return isValid;
}

// Check if we're on localhost/file protocol (for development)
function isLocalDevelopment() {
    return window.location.protocol === 'file:' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
}

// Turnstile callback - stores the token
function onTurnstileSuccess(token) {
    turnstileToken = token;
    document.getElementById('turnstileToken').value = token;
}

// Make callback available globally
window.onTurnstileSuccess = onTurnstileSuccess;

// Send data to webhooks
function sendToWebhook(type) {
    const zapierUrl = 'https://hooks.zapier.com/hooks/catch/21414077/2axrkxs/';
    const stellaUrl = 'https://api.runstella.com/webhook/16216eb0';

    const data = {
        ...quoteData,
        formType: type,
        timestamp: new Date().toISOString(),
        source: 'miboxhouston.com',
        turnstileToken: turnstileToken
    };

    // Send to Zapier
    fetch(zapierUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(err => console.log('Zapier webhook error:', err));

    // Send to Stella
    fetch(stellaUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(err => console.log('Stella webhook error:', err));
}

// Set button loading state
function setButtonLoading(button, loading) {
    if (loading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span class="btn-spinner"></span>Submitting...';
        // Delay disabling to allow click/touch to complete on mobile
        setTimeout(function() {
            button.disabled = true;
        }, 50);
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText;
    }
}

// Handle final form submission (Step 4)
function handleBookingSubmit(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    var submitBtn = document.getElementById('submitBooking');
    if (!submitBtn || submitBtn.dataset.submitting === 'true') {
        return false;
    }
    submitBtn.dataset.submitting = 'true';

    // Validate Step 4 fields
    if (!validateStep(4)) {
        submitBtn.dataset.submitting = 'false';
        return false;
    }

    setButtonLoading(submitBtn, true);

    // Add booking details to quote data
    quoteData.deliveryAddress = document.getElementById('deliveryAddress').value;
    quoteData.deliveryCity = document.getElementById('deliveryCity').value;
    quoteData.deliveryState = document.getElementById('deliveryState').value;
    quoteData.placementLocation = document.getElementById('placementLocation').value;
    quoteData.surfaceType = document.getElementById('surfaceType').value;

    var doorFacing = document.querySelector('input[name="doorFacing"]:checked');
    quoteData.doorFacing = doorFacing ? doorFacing.value : 'street';

    quoteData.gateCode = document.getElementById('gateCode').value;
    quoteData.specialNotes = document.getElementById('specialNotes').value;

    // Send booking to webhooks
    sendToWebhook('booking');

    // Show success state after brief delay
    setTimeout(function() {
        setButtonLoading(submitBtn, false);
        submitBtn.dataset.submitting = 'false';

        var progressEl = document.querySelector('.wizard-progress');
        if (progressEl) progressEl.style.display = 'none';

        document.querySelectorAll('.wizard-panel').forEach(function(panel) {
            panel.classList.remove('active');
        });
        var successPanel = document.getElementById('stepSuccess');
        if (successPanel) successPanel.classList.add('active');

        // Scroll to top of form so user sees success message
        scrollToForm();
    }, 1000);

    return false;
}

// Make function available globally for onclick
window.handleBookingSubmit = handleBookingSubmit;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum delivery date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('deliveryDate').min = tomorrow.toISOString().split('T')[0];

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
            destInput.value = '';
        }
    });

    // Step 1 -> Step 2
    document.getElementById('nextToStep2').addEventListener('click', function() {
        if (validateStep(1)) {
            goToStep(2);
        }
    });

    // Step 2 -> Step 1
    document.getElementById('backToStep1').addEventListener('click', function() {
        goToStep(1);
    });

    // Step 2 -> Step 3
    document.getElementById('nextToStep3').addEventListener('click', function() {
        // Require Turnstile only in production (not on localhost/file://)
        if (!isLocalDevelopment() && !turnstileToken) {
            alert('Please complete the security verification.');
            return;
        }
        if (validateStep(2)) {
            goToStep(3);
        }
    });

    // Step 3 -> Step 2
    document.getElementById('backToStep2').addEventListener('click', function() {
        goToStep(2);
    });

    // Step 3 -> Step 4
    document.getElementById('nextToStep4').addEventListener('click', function() {
        goToStep(4);
    });

    // Step 4 -> Step 3
    document.getElementById('backToStep3').addEventListener('click', function() {
        goToStep(3);
    });

    // Prevent default form submission
    document.getElementById('quoteWizard').addEventListener('submit', function(e) {
        e.preventDefault();
        return false;
    });

    // Submit booking button - use multiple event types for mobile compatibility
    var submitBtn = document.getElementById('submitBooking');
    if (submitBtn) {
        // Standard click event
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleBookingSubmit(e);
        });

        // Touchend for iOS - fires after touch is released
        submitBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            // Small delay to prevent double-firing with click
            var self = this;
            if (!self.dataset.touchFired) {
                self.dataset.touchFired = 'true';
                handleBookingSubmit(e);
                setTimeout(function() {
                    self.dataset.touchFired = 'false';
                }, 300);
            }
        });
    }

    // Clear validation styling on input
    document.querySelectorAll('.form-control, .form-select').forEach(field => {
        field.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    });
});
