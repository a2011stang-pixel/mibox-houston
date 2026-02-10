// ZIP Code Centroids for distance calculation (lat, lng)
const ZIP_CENTROIDS = {
    // Zone 1 - Houston Metro
    '77002': [29.7544, -95.3594], '77003': [29.7394, -95.3436], '77004': [29.7236, -95.3658],
    '77005': [29.7174, -95.4219], '77006': [29.7372, -95.3933], '77007': [29.7725, -95.4036],
    '77008': [29.7936, -95.4147], '77009': [29.7928, -95.3625], '77010': [29.7511, -95.3553],
    '77011': [29.7297, -95.3072], '77012': [29.7136, -95.2814], '77013': [29.7647, -95.2597],
    '77014': [29.9136, -95.4736], '77015': [29.7522, -95.1797], '77016': [29.8319, -95.2975],
    '77017': [29.6969, -95.2481], '77018': [29.8306, -95.4397], '77019': [29.7561, -95.4136],
    '77020': [29.7711, -95.3122], '77021': [29.7047, -95.3583], '77022': [29.8294, -95.3814],
    '77023': [29.7106, -95.3183], '77024': [29.7711, -95.5153], '77025': [29.6906, -95.4258],
    '77026': [29.7906, -95.3342], '77027': [29.7439, -95.4467], '77028': [29.8086, -95.2917],
    '77029': [29.7583, -95.2442], '77030': [29.7069, -95.3989], '77031': [29.6575, -95.5406],
    '77032': [29.9036, -95.3406], '77033': [29.6756, -95.3267], '77034': [29.6197, -95.2183],
    '77035': [29.6531, -95.4728], '77036': [29.6986, -95.5353], '77037': [29.8797, -95.4194],
    '77038': [29.9111, -95.4236], '77039': [29.9039, -95.3681], '77040': [29.8775, -95.5375],
    '77041': [29.8494, -95.5681], '77042': [29.7356, -95.5586], '77043': [29.7856, -95.5611],
    '77044': [29.8339, -95.1742], '77045': [29.6536, -95.4119], '77046': [29.7333, -95.4333],
    '77047': [29.6086, -95.4092], '77048': [29.6206, -95.3506], '77049': [29.8167, -95.1244],
    '77050': [29.8753, -95.3000], '77051': [29.6506, -95.3667], '77053': [29.5956, -95.4619],
    '77054': [29.6894, -95.3961], '77055': [29.7947, -95.4853], '77056': [29.7483, -95.4647],
    '77057': [29.7386, -95.4897], '77058': [29.5522, -95.1000], '77059': [29.5611, -95.1244],
    '77060': [29.9128, -95.3942], '77061': [29.6661, -95.2750], '77062': [29.5672, -95.1508],
    '77063': [29.7283, -95.5147], '77064': [29.9089, -95.5514], '77065': [29.9217, -95.5981],
    '77066': [29.9297, -95.4947], '77067': [29.9139, -95.5139], '77068': [29.9506, -95.4978],
    '77069': [29.9617, -95.5178], '77070': [29.9719, -95.5625], '77071': [29.6533, -95.5125],
    '77072': [29.6919, -95.5806], '77073': [29.9619, -95.4056], '77074': [29.6897, -95.4994],
    '77075': [29.6236, -95.2592], '77076': [29.8528, -95.3650], '77077': [29.7533, -95.5828],
    '77078': [29.7939, -95.2436], '77079': [29.7706, -95.5942], '77080': [29.8178, -95.5194],
    '77081': [29.7094, -95.4769], '77082': [29.7289, -95.6164], '77083': [29.6881, -95.6394],
    '77084': [29.8289, -95.6592], '77085': [29.6261, -95.4639], '77086': [29.8906, -95.4650],
    '77087': [29.6836, -95.2994], '77088': [29.8536, -95.4008], '77089': [29.5867, -95.2292],
    '77090': [29.9539, -95.4581], '77091': [29.8281, -95.4328], '77092': [29.8194, -95.4725],
    '77093': [29.8525, -95.3281], '77094': [29.7756, -95.6561], '77095': [29.8914, -95.6461],
    '77096': [29.6667, -95.4831], '77098': [29.7358, -95.4092], '77099': [29.6694, -95.5644],
    '77201': [29.7589, -95.3644], '77336': [30.0589, -95.1547], '77338': [29.9997, -95.2631],
    '77339': [30.0417, -95.1781], '77345': [30.0122, -95.2058], '77346': [29.9844, -95.1658],
    '77357': [30.1403, -95.2264], '77373': [30.0192, -95.3672], '77375': [30.0556, -95.5047],
    '77377': [30.0075, -95.5417], '77379': [30.0033, -95.5031], '77380': [30.1617, -95.4572],
    '77381': [30.1708, -95.5014], '77382': [30.2014, -95.5236], '77383': [30.1833, -95.4833],
    '77384': [30.1772, -95.4528], '77385': [30.1508, -95.4125], '77386': [30.1056, -95.4042],
    '77388': [30.0528, -95.4364], '77389': [30.1153, -95.5342], '77396': [29.9503, -95.2578],
    '77401': [29.6944, -95.4097], '77406': [29.6367, -95.7500], '77407': [29.6967, -95.7078],
    '77429': [29.9967, -95.6611], '77433': [29.9492, -95.6747], '77447': [30.0219, -95.7481],
    '77449': [29.8322, -95.7244], '77450': [29.7953, -95.6917], '77477': [29.6167, -95.5667],
    '77478': [29.5942, -95.5931], '77479': [29.5575, -95.6064], '77489': [29.5808, -95.5106],
    '77493': [29.7917, -95.8083], '77494': [29.7500, -95.7833], '77498': [29.6333, -95.6333],
    '77502': [29.6764, -95.2092], '77503': [29.6692, -95.1808], '77504': [29.6475, -95.1994],
    '77505': [29.6336, -95.2317], '77506': [29.6881, -95.2150], '77520': [29.7689, -94.9914],
    '77521': [29.8036, -94.9589], '77530': [29.7650, -95.0672], '77536': [29.6761, -95.1144],
    '77546': [29.5503, -95.3742], '77547': [29.7153, -95.1492], '77571': [29.5764, -95.0569],
    '77581': [29.5211, -95.3036], '77584': [29.5072, -95.3725], '77586': [29.5369, -95.1044],
    '77587': [29.6033, -95.2181], '77598': [29.5517, -95.1897],
    // Zone 2 - Extended Houston
    '77301': [30.3144, -95.4542], '77302': [30.2539, -95.4025], '77303': [30.2417, -95.5000],
    '77304': [30.3389, -95.5194], '77306': [30.2703, -95.3500], '77316': [30.3817, -95.6492],
    '77318': [30.3844, -95.5378], '77354': [30.1419, -95.5856], '77356': [30.2717, -95.6250],
    '77362': [30.1253, -95.6508], '77365': [30.0750, -95.3028], '77372': [30.1497, -95.2358],
    '77378': [30.2306, -95.4167], '77423': [29.6917, -95.9667], '77441': [29.7458, -95.9042],
    '77445': [30.0556, -95.9556], '77446': [30.0344, -95.8861], '77461': [29.4958, -95.8917],
    '77464': [29.5500, -95.8333], '77469': [29.5167, -95.7667], '77471': [29.5625, -95.7275],
    '77474': [29.6250, -96.0500], '77476': [29.6458, -95.8208], '77484': [30.0833, -95.8167],
    '77485': [29.6194, -95.8306], '77545': [29.4681, -95.4764], '77573': [29.4833, -95.1333],
    '77574': [29.5000, -95.0500], '77578': [29.4586, -95.2442], '77583': [29.4167, -95.3833],
    '77588': [29.4667, -95.3000],
    // Zone 3 - Outer Houston
    '77327': [30.2936, -94.9169], '77328': [30.2542, -95.0333], '77331': [30.3681, -95.1458],
    '77355': [30.1458, -95.7542], '77363': [30.2222, -95.7778], '77368': [30.4333, -95.0167],
    '77369': [30.3667, -95.0833], '77514': [29.4939, -94.7481], '77523': [29.7694, -94.8389],
    '77532': [29.9122, -94.9917], '77533': [29.8667, -95.0500], '77535': [29.8694, -94.9000],
    '77562': [29.6400, -95.0233], '77565': [29.5042, -94.9750], '77575': [29.8500, -94.8000],
    '77577': [29.4625, -95.0583], '77590': [29.3833, -94.9333], '77591': [29.4167, -95.0000],
    '77592': [29.3667, -94.9667], '77597': [29.5833, -94.6833],
    '77414': [28.9833, -95.9500], '77415': [29.0500, -95.8000], '77417': [29.4083, -95.9417],
    '77418': [29.9167, -96.2500], '77420': [29.3167, -95.8833], '77422': [29.0833, -95.6500],
    '77426': [30.0500, -96.1833], '77430': [29.1333, -95.5500], '77432': [29.1333, -96.1667],
    '77435': [29.3417, -96.0833], '77436': [29.4667, -96.1167], '77437': [29.2500, -96.2167],
    '77440': [28.9500, -95.7167], '77442': [29.4167, -96.2667], '77443': [29.5167, -96.0833],
    '77444': [29.1833, -95.5167], '77448': [29.6000, -96.0833], '77451': [29.6167, -96.0000],
    '77453': [29.0833, -96.0833], '77454': [29.0000, -96.0333], '77455': [29.1167, -96.1500],
    '77456': [28.9000, -96.0167], '77457': [28.8000, -95.9333], '77458': [28.9833, -95.8167],
    '77459': [29.5167, -95.5333], '77463': [29.1833, -96.1333], '77465': [28.9500, -96.3333],
    '77466': [29.7667, -96.0167], '77467': [29.2667, -96.3333], '77468': [29.2000, -95.9500],
    '77470': [29.0833, -96.3667], '77473': [29.6833, -96.0333], '77475': [29.6833, -96.1500],
    '77480': [29.0167, -95.5667], '77481': [29.5000, -95.4833], '77482': [29.0500, -95.9000],
    '77483': [28.7833, -95.9833], '77486': [29.2833, -95.5500], '77487': [29.2500, -95.5167],
    '77488': [29.3167, -95.9333]
};

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
        '20': 179
    }
};

// Service type display names
const SERVICE_NAMES = {
    'onsite': 'Storage (At Your Property)',
    'moving': 'Moving (To New Location)',
    'both': 'Storage + Moving'
};

// Storage location display names (only shown when serviceType is 'onsite')
const STORAGE_LOCATION_NAMES = {
    'customer_property': 'At My Property',
    'secured_facility': 'At Our Secured Facility (Outside Storage Only)'
};

// Map service type + storage location to Stella CRM code
function getServiceCode(serviceType, storageLocation) {
    if (serviceType === 'moving') return 'moving_onsite';
    if (storageLocation === 'secured_facility') return 'store_facility';
    if (serviceType === 'onsite' || serviceType === 'both') return 'store_onsite';
    return '';
}

// Map service type + storage location to human-readable display name
function getServiceDisplay(serviceType, storageLocation) {
    if (serviceType === 'moving') return 'Moving - To New Location';
    if (serviceType === 'onsite' && storageLocation === 'secured_facility') return 'Storage - At Our Secured Facility';
    if (serviceType === 'onsite') return 'Storage - At My Property';
    if (serviceType === 'both' && storageLocation === 'secured_facility') return 'Both - At Our Secured Facility';
    if (serviceType === 'both') return 'Both - At My Property';
    return '';
}

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

// Calculate distance between two ZIP codes using Haversine formula
function calculateDistance(zip1, zip2) {
    var coords1 = ZIP_CENTROIDS[zip1];
    var coords2 = ZIP_CENTROIDS[zip2];

    // If we don't have coordinates for either ZIP, return null
    if (!coords1 || !coords2) return null;

    var lat1 = coords1[0], lon1 = coords1[1];
    var lat2 = coords2[0], lon2 = coords2[1];

    var R = 3959; // Earth's radius in miles
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

// Calculate mileage charge: $4/mile or $40 minimum
function calculateMileageCharge(deliveryZip, destinationZip) {
    var distance = calculateDistance(deliveryZip, destinationZip);

    // If we can't calculate distance, use $40 flat fee
    if (distance === null) return 40;

    var calculatedFee = distance * 4;
    return Math.max(calculatedFee, 40);
}

// Calculate relocation fee: destination delivery fee + mileage charge
function calculateRelocationFee(deliveryZip, destinationZip) {
    // Get destination zone's delivery fee
    var destZone = getDeliveryZone(destinationZip);
    var destDeliveryFee = destZone ? PRICING.delivery[destZone].fee : 0;

    // Calculate mileage charge
    var mileageCharge = calculateMileageCharge(deliveryZip, destinationZip);

    // Relocation fee = destination delivery fee + mileage charge
    return destDeliveryFee + mileageCharge;
}

// Calculate quote
function calculateQuote() {
    const serviceType = document.getElementById('serviceType').value;
    const containerSize = document.getElementById('containerSize').value;
    const deliveryZip = document.getElementById('deliveryZip').value;
    const destinationZip = document.getElementById('destinationZip').value;
    const storageLocation = document.getElementById('storageLocation') ? document.getElementById('storageLocation').value : '';

    if (!serviceType || !deliveryZip) return null;

    const zone = getDeliveryZone(deliveryZip);
    if (!zone) return null;

    let deliveryFee = PRICING.delivery[zone].fee;
    let firstMonthRent = PRICING.firstMonth[containerSize];
    let monthlyRent = 0;
    let pickupFee = 0;
    let relocationFee = 0;

    // Determine monthly rate based on service type
    if (serviceType === 'onsite') {
        // Storage only - rate depends on storage location
        if (storageLocation === 'secured_facility') {
            // Stored at our facility - outside storage rate
            monthlyRent = PRICING.monthly[containerSize].facilityOutside;
        } else {
            // Stored at customer property (default behavior)
            monthlyRent = PRICING.monthly[containerSize].onsite;
        }
        pickupFee = PRICING.delivery[zone].fee;
    } else if (serviceType === 'moving') {
        // Moving - property to property
        monthlyRent = PRICING.monthly[containerSize].onsite;
        relocationFee = calculateRelocationFee(deliveryZip, destinationZip);
        const destZone = getDeliveryZone(destinationZip);
        if (destZone) {
            pickupFee = PRICING.delivery[destZone].fee;
        }
    } else if (serviceType === 'both') {
        // Store now, move later - rate depends on storage location
        if (storageLocation === 'secured_facility') {
            monthlyRent = PRICING.monthly[containerSize].facilityOutside;
        } else {
            // Default to customer property (onsite rate)
            monthlyRent = PRICING.monthly[containerSize].onsite;
        }
        relocationFee = calculateRelocationFee(deliveryZip, destinationZip);
        const destZone = getDeliveryZone(destinationZip);
        if (destZone) {
            pickupFee = PRICING.delivery[destZone].fee;
        }
    }

    // Calculate totals
    const dueToday = deliveryFee + firstMonthRent;
    const ongoingMonthly = monthlyRent;
    const dueWhenDone = relocationFee + pickupFee;

    return {
        deliveryFee,
        relocationFee,
        firstMonthRent,
        monthlyRent,
        pickupFee,
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
    document.getElementById('tableDueToday').textContent = formatCurrency(quote.dueToday);

    // Update Ongoing Monthly box
    document.getElementById('tableMonthlyRent').textContent = formatCurrency(quote.monthlyRent);
    document.getElementById('tableMonthlyTotal').textContent = formatCurrency(quote.ongoingMonthly);

    // Update Future Transportation Fees box
    // Show/hide relocation fee row based on service type
    var relocationFeeRow = document.getElementById('relocationFeeRow');
    if (serviceType === 'moving' || serviceType === 'both') {
        if (relocationFeeRow) {
            relocationFeeRow.style.display = 'flex';
            document.getElementById('tableRelocationFee').textContent = formatCurrency(quote.relocationFee);
        }
    } else {
        if (relocationFeeRow) relocationFeeRow.style.display = 'none';
    }
    document.getElementById('tablePickupFee').textContent = quote.pickupFee > 0 ? formatCurrency(quote.pickupFee) : 'FREE';
    document.getElementById('tablePickupTotal').textContent = formatCurrency(quote.dueWhenDone);

    // Update Estimated Total box (Due Today + Future Transportation Fees)
    var estimatedTotal = quote.dueToday + quote.dueWhenDone;
    document.getElementById('tableOneTimeCosts').textContent = formatCurrency(estimatedTotal);
    document.getElementById('tableEstimatedTotal').textContent = formatCurrency(estimatedTotal);

    // Store quote data
    quoteData = {
        serviceType,
        containerSize,
        deliveryZip,
        destinationZip: document.getElementById('destinationZip').value,
        storageLocation: document.getElementById('storageLocation') ? document.getElementById('storageLocation').value : '',
        deliveryDate,
        storageDuration: document.getElementById('storageDuration').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        company: document.getElementById('company') ? document.getElementById('company').value : '',
        howHeard: document.getElementById('howHeard').value,
        sms_consent: document.getElementById('smsConsent') ? document.getElementById('smsConsent').checked : false,
        sms_consent_timestamp: document.getElementById('smsConsent') && document.getElementById('smsConsent').checked ? new Date().toISOString() : null,
        ...quote
    };

    // Fire quote webhook when pricing is displayed
    sendQuoteWebhook();
}

// Validate step fields
function validateStep(step) {
    let isValid = true;
    let firstInvalid = null;

    if (step === 1) {
        const fields = ['serviceType', 'deliveryZip', 'containerSize', 'storageDuration', 'deliveryDate'];
        const serviceType = document.getElementById('serviceType').value;

        // Add destination ZIP if moving or both
        if (serviceType === 'moving' || serviceType === 'both') {
            fields.push('destinationZip');
        }

        // Check service card selection
        if (!serviceType) {
            document.querySelector('.service-cards').classList.add('is-invalid');
            isValid = false;
        } else {
            document.querySelector('.service-cards').classList.remove('is-invalid');
        }

        // Check storage location selection if onsite service
        if (serviceType === 'onsite') {
            const storageLocation = document.getElementById('storageLocation').value;
            const storageLocationCards = document.querySelector('.storage-location-cards');
            if (!storageLocation) {
                if (storageLocationCards) storageLocationCards.classList.add('is-invalid');
                isValid = false;
                if (!firstInvalid) firstInvalid = storageLocationCards;
            } else {
                if (storageLocationCards) storageLocationCards.classList.remove('is-invalid');
            }
        }

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (fieldId === 'serviceType') return; // Skip hidden input, handled above
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

        // Validate destination ZIP if moving or both
        if (serviceType === 'moving' || serviceType === 'both') {
            const destZip = document.getElementById('destinationZip').value;
            if (destZip && !getDeliveryZone(destZip)) {
                document.getElementById('destinationZip').classList.add('is-invalid');
                alert('Sorry, we do not currently serve the destination ZIP code. Please call us at (713) 929-6051 to discuss options.');
                isValid = false;
            }
        }

        // Validate delivery date is not in the past
        const deliveryDateField = document.getElementById('deliveryDate');
        const selectedDate = deliveryDateField.value;
        if (selectedDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selected = new Date(selectedDate + 'T00:00:00');
            if (selected <= today) {
                deliveryDateField.classList.add('is-invalid');
                alert('Please select a delivery date starting from tomorrow.');
                isValid = false;
                if (!firstInvalid) firstInvalid = deliveryDateField;
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

        // Validate SMS consent - required if phone number is entered
        const phoneField = document.getElementById('phone');
        const smsConsent = document.getElementById('smsConsent');
        const smsConsentError = document.getElementById('smsConsentError');

        if (phoneField && phoneField.value && smsConsent && !smsConsent.checked) {
            smsConsent.classList.add('is-invalid');
            if (smsConsentError) smsConsentError.style.display = 'block';
            isValid = false;
            if (!firstInvalid) firstInvalid = smsConsent;
        } else if (smsConsent) {
            smsConsent.classList.remove('is-invalid');
            if (smsConsentError) smsConsentError.style.display = 'none';
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
    // Hide any error message
    var errorEl = document.getElementById('turnstileError');
    if (errorEl) errorEl.style.display = 'none';
}

// Turnstile error callback
function onTurnstileError(error) {
    console.error('Turnstile error:', error);
    // Show error message to user
    var container = document.getElementById('turnstileContainer');
    if (container) {
        var errorEl = document.getElementById('turnstileError');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'turnstileError';
            errorEl.style.cssText = 'color: #856404; background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 14px;';
            errorEl.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i> Security check unavailable. You can still proceed.';
            container.appendChild(errorEl);
        }
        errorEl.style.display = 'block';
    }
    // Allow form to proceed without Turnstile
    turnstileToken = 'error-fallback';
}

// Make callbacks available globally
window.onTurnstileSuccess = onTurnstileSuccess;
window.onTurnstileError = onTurnstileError;

// Format number as dollar amount (e.g., "$258.00")
function formatDollar(amount) {
    if (typeof amount !== 'number') return amount;
    return '$' + amount.toFixed(2);
}

// Build base quote payload fields
function buildQuoteData() {
    return {
        event_type: 'quote',
        first_name: quoteData.firstName || '',
        last_name: quoteData.lastName || '',
        email: quoteData.email || '',
        phone: quoteData.phone || '',
        company: quoteData.company || '',
        service_needed: getServiceCode(quoteData.serviceType, quoteData.storageLocation),
        service_display: getServiceDisplay(quoteData.serviceType, quoteData.storageLocation),
        box_size: quoteData.containerSize === '16' ? '8x16' : quoteData.containerSize === '20' ? '8x20' : '',
        delivery_zip: quoteData.deliveryZip || '',
        delivery_price: formatDollar(quoteData.deliveryFee),
        first_month_rent: formatDollar(quoteData.firstMonthRent),
        due_today: formatDollar(quoteData.dueToday),
        monthly_rent: formatDollar(quoteData.monthlyRent),
        ongoing_monthly: formatDollar(quoteData.ongoingMonthly),
        pickup_fee: formatDollar(quoteData.pickupFee),
        due_when_done: formatDollar(quoteData.dueWhenDone),
        timestamp: new Date().toISOString(),
        source: 'Website',
        turnstileToken: turnstileToken
    };
}

// Send quote webhook (fires when quote is displayed)
function sendQuoteWebhook() {
    const zapierQuoteUrl = 'https://hooks.zapier.com/hooks/catch/12186485/ue9v8sd/';
    const stellaUrl = 'https://api.runstella.com/webhook/16216eb0';

    const data = buildQuoteData();

    fetch(zapierQuoteUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(err => console.log('Zapier quote webhook error:', err));

    fetch(stellaUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(err => console.log('Stella quote webhook error:', err));
}

// Send booking webhook (fires when booking is submitted)
function sendBookingWebhook() {
    const zapierBookingUrl = 'https://hooks.zapier.com/hooks/catch/12186485/ugs5oqz/';
    const stellaUrl = 'https://api.runstella.com/webhook/16216eb0';

    const data = {
        ...buildQuoteData(),
        event_type: 'booking',
        delivery_address: quoteData.deliveryAddress || '',
        delivery_city: quoteData.deliveryCity || '',
        delivery_state: quoteData.deliveryState || '',
        delivery_date: quoteData.deliveryDate || '',
        placement_location: quoteData.placementLocation || '',
        surface_type: quoteData.surfaceType || '',
        door_facing: quoteData.doorFacing || '',
        gate_code: quoteData.gateCode || '',
        notes: quoteData.specialNotes || ''
    };

    fetch(zapierBookingUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(err => console.log('Zapier booking webhook error:', err));

    fetch(stellaUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(err => console.log('Stella booking webhook error:', err));
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

    // Recalculate quote to ensure pricing values are fresh before sending
    var freshQuote = calculateQuote();
    if (freshQuote) {
        quoteData.deliveryFee = freshQuote.deliveryFee;
        quoteData.firstMonthRent = freshQuote.firstMonthRent;
        quoteData.monthlyRent = freshQuote.monthlyRent;
        quoteData.pickupFee = freshQuote.pickupFee;
        quoteData.dueToday = freshQuote.dueToday;
        quoteData.ongoingMonthly = freshQuote.ongoingMonthly;
        quoteData.dueWhenDone = freshQuote.dueWhenDone;
        quoteData.zone = freshQuote.zone;
    }

    // Send booking to webhooks
    sendBookingWebhook();

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
    var deliveryDateInput = document.getElementById('deliveryDate');

    function getMinDate() {
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    function setMinDate() {
        var minDate = getMinDate();
        deliveryDateInput.min = minDate;
        deliveryDateInput.setAttribute('min', minDate);
        return minDate;
    }

    // Set min attribute immediately
    var minDate = setMinDate();

    // Also set on focus (ensures it's set before picker opens on mobile)
    deliveryDateInput.addEventListener('focus', function() {
        setMinDate();
    });

    // And on touchstart for iOS Safari
    deliveryDateInput.addEventListener('touchstart', function() {
        setMinDate();
    });

    // Validate date on change (fallback for browsers that ignore min)
    deliveryDateInput.addEventListener('change', function() {
        var currentMin = getMinDate();
        var selectedDate = this.value;
        if (selectedDate && selectedDate < currentMin) {
            this.value = currentMin;
            alert('Please select a date starting from tomorrow.');
        }
    });

    // Service card selection
    document.querySelectorAll('.service-card').forEach(function(card) {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            document.querySelectorAll('.service-card').forEach(function(c) {
                c.classList.remove('selected');
            });
            // Add selected class to clicked card
            this.classList.add('selected');
            // Set hidden input value
            var serviceType = this.getAttribute('data-service');
            document.getElementById('serviceType').value = serviceType;
            // Remove invalid state if present
            document.querySelector('.service-cards').classList.remove('is-invalid');

            // Show/hide destination ZIP based on service type
            var destGroup = document.getElementById('destinationZipGroup');
            var destInput = document.getElementById('destinationZip');

            if (serviceType === 'moving' || serviceType === 'both') {
                destGroup.style.display = 'block';
                destInput.required = true;
                destInput.value = ''; // Clear any auto-filled value
            } else {
                destGroup.style.display = 'none';
                destInput.required = false;
                destInput.value = '';
            }

            // Show/hide storage location based on service type
            var storageLocationGroup = document.getElementById('storageLocationGroup');
            var storageLocationInput = document.getElementById('storageLocation');
            var storageLocationCards = document.querySelector('.storage-location-cards');

            if (serviceType === 'onsite' || serviceType === 'both') {
                storageLocationGroup.style.display = 'block';
                storageLocationInput.required = true;
            } else {
                storageLocationGroup.style.display = 'none';
                storageLocationInput.required = false;
                storageLocationInput.value = '';
                // Clear selection
                document.querySelectorAll('.storage-location-card').forEach(function(c) {
                    c.classList.remove('selected');
                });
                if (storageLocationCards) storageLocationCards.classList.remove('is-invalid');
            }
        });
    });

    // Storage location card selection
    document.querySelectorAll('.storage-location-card').forEach(function(card) {
        card.addEventListener('click', function() {
            // Remove selected class from all storage location cards
            document.querySelectorAll('.storage-location-card').forEach(function(c) {
                c.classList.remove('selected');
            });
            // Add selected class to clicked card
            this.classList.add('selected');
            // Set hidden input value
            var storageLocation = this.getAttribute('data-location');
            document.getElementById('storageLocation').value = storageLocation;
            // Remove invalid state if present
            var storageLocationCards = document.querySelector('.storage-location-cards');
            if (storageLocationCards) storageLocationCards.classList.remove('is-invalid');
        });
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
