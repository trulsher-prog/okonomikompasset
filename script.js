// ===================================================================
//  INITIALISERING & GLOBALE VARIABLER
// ===================================================================
window.onload = function () {
    window.scrollTo(0, 0);
    lastInnBudsjett();
    document.getElementById('visKalenderKnapp').style.display = 'none';
};
console.log("script.js v20.1 (Scroll Lock Fix) er lastet!");
let overskuddTilFordeling = 0;
let aktivUtgiftForPeriodisering = null;
let forfallsData = {};

// ===================================================================
//  ELEMENT-DEFINISJONER
// ===================================================================
const hamburgerKnapp = document.getElementById('hamburgerKnapp');
const mobilMeny = document.getElementById('mobilMeny');
const beregnKnapp = document.getElementById('beregnKnapp');
const inntektInput = document.getElementById('inntektEtterSkatt');
const resultatVisning = document.getElementById('resultat');
const tomSkjemaKnapp = document.getElementById('tomSkjemaKnapp');
const alleUtgiftsInput = document.querySelectorAll('.utgifts-input');
const sumFasteSpan = document.getElementById('sumFaste');
const sumVariableSpan = document.getElementById('sumVariable');
const sumTotalSpan = document.getElementById('sumTotal');
const sparemalBoks = document.getElementById('sparemalListe');
const alleSlidere = document.querySelectorAll('.fordeling-slider');
const resterendeProsentSpan = document.getElementById('resterendeProsent');
const infoPanel = document.getElementById('infoPanel');
const detaljPanel = document.getElementById('detaljPanel');
const forsikringPanel = document.getElementById('forsikringPanel');
const forsikringHovedInput = document.getElementById('utgiftForsikring');
const summerForsikringKnapp = document.getElementById('summerForsikringKnapp');
const alleForsikringsInput = forsikringPanel.querySelectorAll('.detalj-input');
const visKalenderKnapp = document.getElementById('visKalenderKnapp');
const kalenderOverlay = document.getElementById('kalenderOverlay');
const lukkKalenderKnapp = document.getElementById('lukkKalenderKnapp');
const forfallsListeContainer = document.getElementById('forfallListe');
const periodeOverlay = document.getElementById('periodeOverlay');
const lukkPeriodeKnapp = document.getElementById('lukkPeriodeKnapp');
const lagrePeriodeKnapp = document.getElementById('lagrePeriodeKnapp');
const manedsvelgerContainer = document.getElementById('manedsvelger');
const periodeUtgiftNavnSpan = document.getElementById('periodeUtgiftNavn');
const genererKalenderKnapp = document.getElementById('genererKalenderKnapp');
const kalenderGridWrapper = document.getElementById('kalenderGridWrapper');
const kalenderGrid = document.getElementById('kalenderGrid');
const manedVelger = document.getElementById('manedVelger');
const aarVelger = document.getElementById('aarVelger');

// ===================================================================
//  FUNKSJONER
// ===================================================================
const infoTekster = {
    sliderKortPersonlig: { tittel: "Kortsiktig (Personlig)", tekst: "Penger du setter av til personlig forbruk innen det neste året. For eksempel sparing til den nye pulsklokka, en helgetur, eller en ny jakke." },
    sliderLangPersonlig: { tittel: "Langsiktig (Personlig)", tekst: "Midler satt av til dine egne, større drømmer lenger frem i tid. Dette kan være egenkapital til bolig, sparing i fond, eller en spesiell reise om noen år." },
    sliderKortFamilie: { tittel: "Kortsiktig (Familie)", tekst: "Felles penger for familieopplevelser det neste året. For eksempel billetter til et show, en tur i tivoli, eller en fin middag ute." },
    sliderLangFamilie: { tittel: "Langsiktig (Familie)", tekst: "Sparing til store, felles mål for familien, som for eksempel neste års sommerferie, oppussing, eller konfirmasjon." },
    sliderBuffer: { tittel: "Bufferkonto", tekst: "En ekstremt viktig pott for uforutsette utgifter. Målet er typisk å ha 1-3 månedslønner her til å dekke ting som en ødelagt vaskemaskin eller en uventet tannlegeregning." },
    sliderGjeld: { tittel: "Ekstra nedbetaling av gjeld", tekst: "Penger du bruker for å betale ned gjeld raskere enn planen, spesielt dyr gjeld som forbrukslån eller kredittkort. Dette er en investering i din fremtidige frihet." }
};

function oppdaterInfoPanel(key) {
    const innhold = infoTekster[key];
    if (innhold) {
        infoPanel.innerHTML = `<h4>${innhold.tittel}</h4><p>${innhold.tekst}</p>`;
        infoPanel.classList.add('vis');
    } else {
        infoPanel.classList.remove('vis');
    }
}

function oppdaterDetaljPanel(fokusertInputId) {
    detaljPanel.querySelectorAll('.panel-innhold').forEach(panel => panel.classList.remove('vis'));
    let skalViseDetaljPanel = false;
    if (fokusertInputId === 'utgiftForsikring') {
        forsikringPanel.classList.add('vis');
        skalViseDetaljPanel = true;
    }
    if (skalViseDetaljPanel) {
        detaljPanel.classList.add('vis');
    } else {
        detaljPanel.classList.remove('vis');
    }
}

function tomHeleSkjemaet() {
    const bekreftet = confirm("Er du sikker på at du vil tømme hele skjemaet? All lagret data vil bli slettet.");
    if (bekreftet) {
        localStorage.removeItem('okonomikompassBudsjett');
        location.reload();
    }
}

function lagreBudsjett() {
    const data = {
        inntekt: inntektInput.value,
        utgifter: [],
        fordeling: [],
        forfall: forfallsData
    };
    document.querySelectorAll('.utgift-rad').forEach(rad => {
        const checkbox = rad.querySelector('.utgifts-checkbox');
        const input = rad.querySelector('.utgifts-input');
        if (input && checkbox) {
            data.utgifter.push({
                id: input.id, verdi: input.value, erValgt: checkbox.checked,
                erEgenRad: rad.classList.contains('egen-rad'),
                labelTekst: rad.querySelector('label').textContent
            });
        }
    });
    alleSlidere.forEach(slider => {
        data.fordeling.push({ id: slider.id, verdi: slider.value });
    });
    localStorage.setItem('okonomikompassBudsjett', JSON.stringify(data));
}

function lastInnBudsjett() {
    const dataString = localStorage.getItem('okonomikompassBudsjett');
    if (!dataString) {
        document.querySelectorAll('.utgifts-checkbox').forEach(aktiverCheckboxLytter);
        return;
    }
    const data = JSON.parse(dataString);
    inntektInput.value = data.inntekt || '';
    forfallsData = data.forfall || {};
    document.querySelectorAll('.egen-rad').forEach(rad => rad.remove());
    data.utgifter.forEach(utgift => {
        if (utgift.erEgenRad) {
            const listeId = utgift.id.toLowerCase().includes('mat') || utgift.id.toLowerCase().includes('strøm') ? 'variabelUtgiftsListe' : 'utgiftsListe';
            const listeElement = document.getElementById(listeId) || document.getElementById('utgiftsListe');
            if (listeElement) {
                leggTilNyUtgiftsrad(listeElement, utgift.labelTekst, utgift.id, utgift.verdi, utgift.erValgt);
            }
        } else {
            const input = document.getElementById(utgift.id);
            const checkbox = document.querySelector(`[data-target="${utgift.id}"]`);
            if (input) input.value = utgift.verdi;
            if (checkbox) checkbox.checked = utgift.erValgt;
        }
    });
    document.querySelectorAll('.utgifts-checkbox').forEach(aktiverCheckboxLytter);
    data.fordeling.forEach(post => {
        const slider = document.getElementById(post.id);
        if (slider) slider.value = post.verdi;
    });
    oppdaterOppsummering();
    beregnOverskudd(false);
}

function aktiverCheckboxLytter(checkboxElement) {
    const targetId = checkboxElement.dataset.target;
    const tilhorendeInputWrapper = document.getElementById(targetId).parentElement;
    function toggleVisning() {
        if (checkboxElement.checked) { tilhorendeInputWrapper.classList.add('vis'); }
        else { tilhorendeInputWrapper.classList.remove('vis'); }
    }
    checkboxElement.addEventListener('change', () => {
        toggleVisning();
        oppdaterOppsummering();
        lagreBudsjett();
    });
    toggleVisning();
}

function leggTilNyUtgiftsrad(listeElement, tekst = null, id = null, verdi = null, erValgt = true) {
    const radTekst = tekst || prompt("Hva heter den nye utgiftsposten?");
    if (!radTekst || radTekst.trim() === "") return;
    const unikId = id || "input-custom-" + Date.now();
    const checkboxId = "check-" + unikId.replace('input-', '');
    const nyRadHTML = `<div class="utgift-rad egen-rad"><div class="checkbox-wrapper"><input type="checkbox" id="${checkboxId}" class="utgifts-checkbox" data-target="${unikId}"><label for="${checkboxId}">${radTekst}</label></div><div class="input-wrapper"><input type="number" id="${unikId}" class="utgifts-input" placeholder="0"></div></div>`;
    const knapp = listeElement.querySelector('.legg-til-knapp');
    knapp.insertAdjacentHTML('beforebegin', nyRadHTML);
    const nyCheckbox = document.getElementById(checkboxId);
    const nyInput = document.getElementById(unikId);
    nyCheckbox.checked = erValgt;
    nyInput.value = verdi || '';
    aktiverCheckboxLytter(nyCheckbox);
    nyInput.addEventListener('input', () => { oppdaterOppsummering(); lagreBudsjett(); });
    if (!tekst) { lagreBudsjett(); oppdaterOppsummering(); }
}

function beregnOverskudd(erManuellBeregning = false) {
    const inntektVerdi = parseFloat(inntektInput.value);
    if (isNaN(inntektVerdi)) {
        resultatVisning.textContent = "Vennligst fyll ut inntekt.";
        resultatVisning.style.color = 'red';
        sparemalBoks.classList.remove('vis');
        visKalenderKnapp.style.display = 'none';
        return;
    }
    let totalUtgifter = 0;
    document.querySelectorAll('.utgifts-input').forEach(input => {
        const wrapper = input.parentElement;
        if (wrapper.classList.contains('vis')) { totalUtgifter += parseFloat(input.value) || 0; }
    });
    const disponibelt = inntektVerdi - totalUtgifter;
    overskuddTilFordeling = disponibelt > 0 ? disponibelt : 0;
    const resultatMelding = `Disponibelt beløp: ${disponibelt.toFixed(2)} kr.`;
    const oppfordring = "Hvordan vil du fordele dette? Bruk sliderne for å finne din kurs.";
    resultatVisning.innerHTML = `${resultatMelding}<br><small>${oppfordring}</small>`;
    resultatVisning.style.color = disponibelt >= 0 ? '#28a745' : '#dc3545';
    if (disponibelt > 0) {
        if (erManuellBeregning) { alleSlidere.forEach(slider => slider.value = 0); }
        sparemalBoks.classList.add('vis');
        visKalenderKnapp.style.display = 'block';
        oppdaterFordeling();
    } else {
        sparemalBoks.classList.remove('vis');
        visKalenderKnapp.style.display = 'none';
    }
}

function oppdaterFordeling(endretSlider = null) {
    let totalProsent = 0;
    alleSlidere.forEach(slider => totalProsent += parseInt(slider.value));
    if (totalProsent > 100 && endretSlider) {
        let overskuddProsent = totalProsent - 100;
        const andreSlidere = Array.from(alleSlidere).filter(s => s !== endretSlider && parseInt(s.value) > 0);
        while (overskuddProsent > 0 && andreSlidere.length > 0) {
            let reduksjonPerSlider = Math.ceil(overskuddProsent / andreSlidere.length);
            for (let i = 0; i < andreSlidere.length && overskuddProsent > 0; i++) {
                let slider = andreSlidere[i];
                let faktiskReduksjon = Math.min(parseInt(slider.value), reduksjonPerSlider, overskuddProsent);
                slider.value = parseInt(slider.value) - faktiskReduksjon;
                overskuddProsent -= faktiskReduksjon;
            }
        }
        totalProsent = 100;
    }
    alleSlidere.forEach(slider => {
        const prosent = parseInt(slider.value);
        const kroneVerdi = (prosent / 100) * overskuddTilFordeling;
        const verdiWrapper = slider.nextElementSibling;
        verdiWrapper.querySelector('.slider-verdi').textContent = `${prosent}%`;
        verdiWrapper.querySelector('.slider-nok-verdi').textContent = `${kroneVerdi.toFixed(0)} kr`;
        const oppsummeringSpan = document.querySelector(`.oppsummering-nok-verdi[data-target-slider="${slider.id}"]`);
        if (oppsummeringSpan) { oppsummeringSpan.textContent = `${kroneVerdi.toFixed(0)} kr`; }
    });
    const resterendeProsent = 100 - totalProsent;
    resterendeProsentSpan.textContent = `${resterendeProsent}%`;
    resterendeProsentSpan.style.color = resterendeProsent === 0 ? '#28a745' : '#007bff';
}

function oppdaterOppsummering() {
    let sumFaste = 0;
    document.querySelectorAll('#utgiftsListe .utgifts-input').forEach(input => {
        if (input.parentElement.classList.contains('vis')) { sumFaste += parseFloat(input.value) || 0; }
    });
    let sumVariable = 0;
    document.querySelectorAll('#variabelUtgiftsListe .utgifts-input').forEach(input => {
        if (input.parentElement.classList.contains('vis')) { sumVariable += parseFloat(input.value) || 0; }
    });
    const sumTotal = sumFaste + sumVariable;
    sumFasteSpan.textContent = `${sumFaste.toFixed(0)} kr`;
    sumVariableSpan.textContent = `${sumVariable.toFixed(0)} kr`;
    sumTotalSpan.textContent = `${sumTotal.toFixed(0)} kr`;
}

function byggForfallsliste() {
    forfallsListeContainer.innerHTML = '';
    forfallsListeContainer.insertAdjacentHTML('beforeend', '<h4>Inntekter</h4>');
    const inntektVerdi = parseFloat(inntektInput.value) || 0;
    const lagretInntektDag = (forfallsData.inntekt && forfallsData.inntekt.dag) || '';
    let inntektRadHTML = `<div class="forfall-rad" data-rad-id="inntekt"><span class="forfall-label">Lønn <span class="forfall-belop">${inntektVerdi.toFixed(0)} kr</span></span><div class="forfall-input-wrapper"><span class="periode-visning"></span><label for="forfall-inntekt">Dag:</label><input type="number" id="forfall-inntekt" class="forfall-dato-input" min="1" max="31" placeholder="Dato" value="${lagretInntektDag}"><button class="periodisering-knapp" data-target-utgift="inntekt">Endre periode</button></div></div>`;
    forfallsListeContainer.insertAdjacentHTML('beforeend', inntektRadHTML);
    oppdaterPeriodeVisning('inntekt');
    forfallsListeContainer.insertAdjacentHTML('beforeend', '<h4>Utgifter</h4>');
    document.querySelectorAll('.utgifts-input').forEach(input => {
        if (input.parentElement.classList.contains('vis')) {
            const labelTekst = input.closest('.utgift-rad').querySelector('label').textContent;
            const utgiftVerdi = parseFloat(input.value) || 0;
            const inputId = input.id;
            const lagretUtgiftDag = (forfallsData[inputId] && forfallsData[inputId].dag) || '';
            let radHTML = `<div class="forfall-rad" data-rad-id="${inputId}"><span class="forfall-label">${labelTekst} <span class="forfall-belop">${utgiftVerdi.toFixed(0)} kr</span></span><div class="forfall-input-wrapper"><span class="periode-visning"></span><label for="forfall-${inputId}">Dag:</label><input type="number" id="forfall-${inputId}" class="forfall-dato-input" min="1" max="31" placeholder="Dato" value="${lagretUtgiftDag}"><button class="periodisering-knapp" data-target-utgift="${inputId}">Endre periode</button></div></div>`;
            forfallsListeContainer.insertAdjacentHTML('beforeend', radHTML);
            oppdaterPeriodeVisning(inputId);
        }
    });
    document.querySelectorAll('.periodisering-knapp').forEach(knapp => {
        knapp.addEventListener('click', function () {
            const utgiftId = this.dataset.targetUtgift;
            const utgiftNavn = this.closest('.forfall-rad').querySelector('.forfall-label').childNodes[0].nodeValue.trim();
            aapnePeriodiseringModal(utgiftId, utgiftNavn);
        });
    });
    document.querySelectorAll('.forfall-dato-input').forEach(input => {
        input.addEventListener('input', function () {
            const utgiftId = this.id.replace('forfall-', '');
            if (!forfallsData[utgiftId]) { forfallsData[utgiftId] = {}; }
            forfallsData[utgiftId].dag = this.value;
            lagreBudsjett();
        });
    });
}

function aapnePeriodiseringModal(utgiftId, utgiftNavn) {
    aktivUtgiftForPeriodisering = utgiftId;
    periodeUtgiftNavnSpan.textContent = utgiftNavn;
    const maneder = ["Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember"];
    manedsvelgerContainer.innerHTML = '';
    const eksisterendeValg = (forfallsData[utgiftId] && forfallsData[utgiftId].maneder) || maneder.map((_, i) => i);
    maneder.forEach((maned, index) => {
        const manedId = `maned-${index}`;
        const isChecked = eksisterendeValg.includes(index);
        const checkboxHTML = `<div class="checkbox-wrapper"><input type="checkbox" id="${manedId}" class="maned-checkbox" value="${index}" ${isChecked ? 'checked' : ''}><label for="${manedId}">${maned}</label></div>`;
        manedsvelgerContainer.insertAdjacentHTML('beforeend', checkboxHTML);
    });
    periodeOverlay.classList.add('vis');
    document.body.classList.add('scroll-lock'); // LÅS SCROLL
}

function lagrePeriodisering() {
    const valgteManeder = Array.from(document.querySelectorAll('.maned-checkbox:checked')).map(cb => parseInt(cb.value));
    if (!forfallsData[aktivUtgiftForPeriodisering]) {
        forfallsData[aktivUtgiftForPeriodisering] = {};
    }
    forfallsData[aktivUtgiftForPeriodisering].maneder = valgteManeder;
    oppdaterPeriodeVisning(aktivUtgiftForPeriodisering);
    periodeOverlay.classList.remove('vis');
    document.body.classList.remove('scroll-lock'); // LÅS OPP SCROLL
    lagreBudsjett();
}

function oppdaterPeriodeVisning(utgiftId) {
    const radElement = document.querySelector(`.forfall-rad[data-rad-id="${utgiftId}"]`);
    if (!radElement) return;
    const visningSpan = radElement.querySelector('.periode-visning');
    const data = forfallsData[utgiftId];
    const manederKort = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
    if (data && data.maneder !== undefined) {
        if (data.maneder.length === 12) { visningSpan.textContent = 'Hver måned'; }
        else if (data.maneder.length === 0) { visningSpan.textContent = 'Ingen valgt'; }
        else { visningSpan.textContent = data.maneder.map(mIndex => manederKort[mIndex]).join(', '); }
    } else {
        visningSpan.textContent = 'Hver måned';
    }
}

function fyllUtDatovelgere() {
    const maneder = ["Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember"];
    const naa = new Date();
    const currentAar = naa.getFullYear();
    const currentManed = naa.getMonth();
    manedVelger.innerHTML = '';
    maneder.forEach((maned, index) => {
        const option = new Option(maned, index);
        if (index === currentManed) { option.selected = true; }
        manedVelger.add(option);
    });
    aarVelger.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const aar = currentAar + i;
        const option = new Option(aar, aar);
        aarVelger.add(option);
    }
}

function genererKalender(aar, maned) {
    kalenderGrid.innerHTML = '';
    const forsteDagIManeden = new Date(aar, maned, 1).getDay();
    const dagerIManeden = new Date(aar, maned + 1, 0).getDate();
    const startOffset = forsteDagIManeden === 0 ? 6 : forsteDagIManeden - 1;
    const ukedager = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
    ukedager.forEach(dag => {
        kalenderGrid.insertAdjacentHTML('beforeend', `<div class="kalender-dag ukedag">${dag}</div>`);
    });
    for (let i = 0; i < startOffset; i++) {
        kalenderGrid.insertAdjacentHTML('beforeend', '<div class="kalender-dag tom"></div>');
    }
    for (let dag = 1; dag <= dagerIManeden; dag++) {
        let hendelserHTML = '';
        const inntektData = forfallsData['inntekt'];
        if (inntektData && parseInt(inntektData.dag) === dag) {
            if ((inntektData.maneder === undefined || inntektData.maneder.length === 12 || inntektData.maneder.includes(maned))) {
                hendelserHTML += `<div class="hendelse inntekt">Lønn</div>`;
            }
        }
        document.querySelectorAll('.utgifts-input').forEach(input => {
            if (input.parentElement.classList.contains('vis')) {
                const utgiftId = input.id;
                const data = forfallsData[utgiftId];
                if (data && parseInt(data.dag) === dag) {
                    const gjelderDenneManed = (data.maneder === undefined || data.maneder.length === 12 || data.maneder.includes(maned));
                    if (gjelderDenneManed) {
                        const labelTekst = input.closest('.utgift-rad').querySelector('label').textContent;
                        hendelserHTML += `<div class="hendelse utgift">${labelTekst}</div>`;
                    }
                }
            }
        });
        const dagHTML = `<div class="kalender-dag"><div class="dag-nummer">${dag}</div><div class="hendelser-liste">${hendelserHTML}</div></div>`;
        kalenderGrid.insertAdjacentHTML('beforeend', dagHTML);
    }
    kalenderGridWrapper.classList.add('vis');
}

// ===================================================================
//  LYTTERE
// ===================================================================
hamburgerKnapp.addEventListener('click', () => {
    mobilMeny.classList.toggle('apen');
    hamburgerKnapp.classList.toggle('apen');
    document.body.classList.toggle('scroll-lock');
});
beregnKnapp.addEventListener('click', () => beregnOverskudd(true));
tomSkjemaKnapp.addEventListener('click', tomHeleSkjemaet);
document.getElementById('leggTilFastUtgift').addEventListener('click', () => leggTilNyUtgiftsrad(document.getElementById('utgiftsListe')));
document.getElementById('leggTilVariabelUtgift').addEventListener('click', () => leggTilNyUtgiftsrad(document.getElementById('variabelUtgiftsListe')));
document.querySelectorAll('.utgifts-checkbox:not([id*="custom"])').forEach(aktiverCheckboxLytter);
inntektInput.addEventListener('input', () => {
    if (resultatVisning.textContent.includes("Vennligst fyll ut inntekt")) { resultatVisning.textContent = ''; }
    oppdaterOppsummering();
    lagreBudsjett();
});
document.querySelectorAll('.utgifts-input').forEach(input => {
    input.addEventListener('input', () => {
        oppdaterOppsummering();
        lagreBudsjett();
    });
});
alleUtgiftsInput.forEach(input => {
    input.addEventListener('focus', () => oppdaterDetaljPanel(input.id));
});
alleSlidere.forEach(slider => {
    slider.addEventListener('focus', () => oppdaterInfoPanel(slider.id));
    slider.addEventListener('input', () => oppdaterFordeling(slider));
    slider.addEventListener('change', lagreBudsjett);
});
summerForsikringKnapp.addEventListener('click', function () {
    let forsikringSum = 0;
    alleForsikringsInput.forEach(input => forsikringSum += parseFloat(input.value) || 0);
    forsikringHovedInput.value = forsikringSum.toFixed(0);
    forsikringHovedInput.dispatchEvent(new Event('input'));
    detaljPanel.classList.remove('vis');
});
visKalenderKnapp.addEventListener('click', () => {
    byggForfallsliste();
    fyllUtDatovelgere();
    genererKalenderKnapp.click();
    kalenderOverlay.classList.add('vis');
    document.body.classList.add('scroll-lock');
});
lukkKalenderKnapp.addEventListener('click', () => {
    kalenderOverlay.classList.remove('vis');
    document.body.classList.remove('scroll-lock');
});
kalenderOverlay.addEventListener('click', (event) => {
    if (event.target === kalenderOverlay) {
        kalenderOverlay.classList.remove('vis');
        document.body.classList.remove('scroll-lock');
    }
});
lukkPeriodeKnapp.addEventListener('click', () => {
    periodeOverlay.classList.remove('vis');
    document.body.classList.remove('scroll-lock');
});
lagrePeriodeKnapp.addEventListener('click', lagrePeriodisering);
genererKalenderKnapp.addEventListener('click', () => {
    const valgtAar = parseInt(aarVelger.value);
    const valgtManed = parseInt(manedVelger.value);
    genererKalender(valgtAar, valgtManed);
});
manedVelger.addEventListener('change', () => genererKalenderKnapp.click());
aarVelger.addEventListener('change', () => genererKalenderKnapp.click());