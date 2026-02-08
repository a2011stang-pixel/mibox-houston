// Pricing Configuration
export const PRICING = {
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
        '20': 179
    }
};

// Service type display names
export const SERVICE_NAMES = {
    'onsite': 'Storage (At Your Property)',
    'moving': 'Moving (To New Location)',
    'both': 'Storage + Moving'
};

// Get delivery zone from ZIP
export function getDeliveryZone(zip) {
    if (PRICING.delivery.zone1.zips.includes(zip)) return 'zone1';
    if (PRICING.delivery.zone2.zips.includes(zip)) return 'zone2';
    if (PRICING.delivery.zone3.zips.includes(zip)) return 'zone3';
    return null;
}

// Format currency
export function formatCurrency(amount) {
    return '$' + amount.toFixed(2);
}

// Format number as dollar amount (e.g., "$258.00")
export function formatDollar(amount) {
    if (typeof amount !== 'number') return amount;
    return '$' + amount.toFixed(2);
}

// Format date for display
export function formatDate(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// Calculate quote based on form data
export function calculateQuoteFromData({ serviceType, containerSize, deliveryZip, destinationZip }) {
    if (!serviceType || !deliveryZip) return null;

    const zone = getDeliveryZone(deliveryZip);
    if (!zone) return null;

    let deliveryFee = PRICING.delivery[zone].fee;
    let firstMonthRent = PRICING.firstMonth[containerSize];
    let monthlyRent = 0;
    let pickupFee = 0;

    if (serviceType === 'onsite') {
        monthlyRent = PRICING.monthly[containerSize].onsite;
        pickupFee = PRICING.delivery[zone].fee;
    } else if (serviceType === 'moving') {
        monthlyRent = PRICING.monthly[containerSize].onsite;
        const destZone = getDeliveryZone(destinationZip);
        if (destZone) {
            pickupFee = PRICING.delivery[destZone].fee;
        }
    } else if (serviceType === 'both') {
        monthlyRent = PRICING.monthly[containerSize].facilityInside;
        const destZone = getDeliveryZone(destinationZip);
        if (destZone) {
            pickupFee = PRICING.delivery[destZone].fee;
        }
    }

    const dueToday = deliveryFee + firstMonthRent;
    const ongoingMonthly = monthlyRent;
    const dueWhenDone = pickupFee;

    return {
        deliveryFee,
        firstMonthRent,
        monthlyRent,
        pickupFee,
        dueToday,
        ongoingMonthly,
        dueWhenDone,
        zone
    };
}

// Validate email format
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Check if date is in the past (before tomorrow)
export function isDateInPast(dateString) {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(dateString + 'T00:00:00');
    return selected <= today;
}

// Build webhook payload from quote data
export function buildWebhookPayload(quoteData, formType, turnstileToken = null) {
    return {
        ...quoteData,
        deliveryFee: formatDollar(quoteData.deliveryFee),
        firstMonthRent: formatDollar(quoteData.firstMonthRent),
        monthlyRent: formatDollar(quoteData.monthlyRent),
        pickupFee: formatDollar(quoteData.pickupFee),
        dueToday: formatDollar(quoteData.dueToday),
        ongoingMonthly: formatDollar(quoteData.ongoingMonthly),
        dueWhenDone: formatDollar(quoteData.dueWhenDone),
        formType,
        timestamp: new Date().toISOString(),
        source: 'miboxhouston.com',
        turnstileToken
    };
}

// Validate step 1 fields
export function validateStep1Fields({ serviceType, deliveryZip, containerSize, storageDuration, deliveryDate, destinationZip }) {
    const errors = [];

    if (!serviceType) {
        errors.push({ field: 'serviceType', message: 'Please select a service type' });
    }

    if (!deliveryZip) {
        errors.push({ field: 'deliveryZip', message: 'Please enter a delivery ZIP code' });
    } else if (!getDeliveryZone(deliveryZip)) {
        errors.push({ field: 'deliveryZip', message: 'Sorry, we do not currently serve that ZIP code' });
    }

    if (!containerSize) {
        errors.push({ field: 'containerSize', message: 'Please select a container size' });
    }

    if (!storageDuration) {
        errors.push({ field: 'storageDuration', message: 'Please select how long you need storage' });
    }

    if (!deliveryDate) {
        errors.push({ field: 'deliveryDate', message: 'Please select a delivery date' });
    } else if (isDateInPast(deliveryDate)) {
        errors.push({ field: 'deliveryDate', message: 'Please select a delivery date starting from tomorrow' });
    }

    if (serviceType === 'moving' || serviceType === 'both') {
        if (!destinationZip) {
            errors.push({ field: 'destinationZip', message: 'Please enter a destination ZIP code' });
        } else if (!getDeliveryZone(destinationZip)) {
            errors.push({ field: 'destinationZip', message: 'Sorry, we do not currently serve the destination ZIP code' });
        }
    }

    return errors;
}

// Validate step 2 fields
export function validateStep2Fields({ firstName, email, phone, smsConsent }) {
    const errors = [];

    if (!firstName) {
        errors.push({ field: 'firstName', message: 'Please enter your first name' });
    }

    if (!email) {
        errors.push({ field: 'email', message: 'Please enter your email address' });
    } else if (!isValidEmail(email)) {
        errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    if (!phone) {
        errors.push({ field: 'phone', message: 'Please enter your phone number' });
    }

    if (phone && !smsConsent) {
        errors.push({ field: 'smsConsent', message: 'Please agree to receive SMS messages' });
    }

    return errors;
}

// Validate step 4 fields
export function validateStep4Fields({ deliveryAddress, deliveryCity, placementLocation, surfaceType }) {
    const errors = [];

    if (!deliveryAddress) {
        errors.push({ field: 'deliveryAddress', message: 'Please enter the delivery address' });
    }

    if (!deliveryCity) {
        errors.push({ field: 'deliveryCity', message: 'Please enter the city' });
    }

    if (!placementLocation) {
        errors.push({ field: 'placementLocation', message: 'Please select a placement location' });
    }

    if (!surfaceType) {
        errors.push({ field: 'surfaceType', message: 'Please select a surface type' });
    }

    return errors;
}
