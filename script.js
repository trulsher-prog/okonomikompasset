// Tvinger siden til toppen
window.onload = function() {
  window.scrollTo(0, 0);
  lastInnBudsjett();
};
console.log("script.js v9 (med Tøm Skjema) er lastet!");

let overskuddTilFordeling = 0;

// ===================================================================
//  ELEMENT-DEFINISJONER
// ===================================================================
const hamburgerKnapp = document.getElementById('hamburgerKnapp');
const mobilMeny = document.getElementById('mobilMeny');
const beregnKnapp = document.getElementById('beregnKnapp');
const inntektInput = document.getElementById('inntektEtterSkatt');
const resultatVisning = document.getElementById('resultat');
const sparemalBoks = document.getElementById('sparemalListe');
const alleSlidere = document.querySelectorAll('.fordeling-slider');
const resterendeProsentSpan = document.getElementById('resterendeProsent');
const tomSkjemaKnapp = document.getElementById('tomSkjemaKnapp');


// ===================================================================
//  FUNKSJONER
// ===================================================================

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
        fordeling: []
    };
    document.querySelectorAll('.utgift-rad').forEach(rad => {
        const checkbox = rad.querySelector('.utgifts-checkbox');
        const input = rad.querySelector('.utgifts-input');
        data.utgifter.push({
            id: input.id,
            verdi: input.value,
            erValgt: checkbox.checked,
            erEgenRad: rad.classList.contains('egen-rad'),
            labelTekst: rad.querySelector('label').textContent
        });
    });
    alleSlidere.forEach(slider => {
        data.fordeling.push({ id: slider.id, verdi: slider.value });
    });
    localStorage.setItem('okonomikompassBudsjett', JSON.stringify(data));
}

function lastInnBudsjett() {
    const dataString = localStorage.getItem('okonomikompassBudsjett');
    if (!dataString) return;
    const data = JSON.parse(dataString);
    inntektInput.value = data.inntekt || '';
    data.utgifter.forEach(utgift => {
        if (utgift.erEgenRad) {
            const antattListeId = utgift.id.includes('Fast') ? 'utgiftsListe' : 'variabelUtgiftsListe';
            const listeElement = document.getElementById(antattListeId) || document.querySelector('.input-boks:has(.legg-til-knapp)');
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
    document.querySelectorAll('.utgifts-checkbox:not([id*="custom"])').forEach(aktiverCheckboxLytter);
    data.fordeling.forEach(post => {
        const slider = document.getElementById(post.id);
        if (slider) slider.value = post.verdi;
    });
    beregnKnapp.click();
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
    nyCheckbox.addEventListener('change', lagreBudsjett);
    nyInput.addEventListener('input', lagreBudsjett);
    if (!tekst) {
        lagreBudsjett();
    }
}

function aktiverCheckboxLytter(checkboxElement) {
    const targetId = checkboxElement.dataset.target;
    const tilhorendeInputWrapper = document.getElementById(targetId).parentElement;
    function toggleVisning() {
        if (checkboxElement.checked) {
            tilhorendeInputWrapper.classList.add('vis');
        } else {
            tilhorendeInputWrapper.classList.remove('vis');
        }
    }
    checkboxElement.addEventListener('change', toggleVisning);
    toggleVisning();
}

function beregnOverskudd() {
  const inntektVerdi = parseFloat(inntektInput.value);
  if (isNaN(inntektVerdi)) {
      resultatVisning.textContent = "Vennligst fyll ut inntekt.";
      resultatVisning.style.color = 'red';
      sparemalBoks.classList.remove('vis');
      return;
  }
  let totalUtgifter = 0;
  document.querySelectorAll('.utgifts-input').forEach(input => {
      const wrapper = input.parentElement;
      if (wrapper.classList.contains('vis')) {
          totalUtgifter += parseFloat(input.value) || 0;
      }
  });
  const disponibelt = inntektVerdi - totalUtgifter;
  overskuddTilFordeling = disponibelt > 0 ? disponibelt : 0;
  const resultatMelding = `Disponibelt beløp: ${disponibelt.toFixed(2)} kr.`;
  const oppfordring = "Hvordan vil du fordele dette? Bruk sliderne for å finne din kurs.";
  resultatVisning.innerHTML = `${resultatMelding}<br><small>${oppfordring}</small>`;
  resultatVisning.style.color = disponibelt >= 0 ? '#28a745' : '#dc3545';
  if (disponibelt > 0) {
      sparemalBoks.classList.add('vis');
      oppdaterFordeling();
  } else {
      sparemalBoks.classList.remove('vis');
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
  });
  const resterendeProsent = 100 - totalProsent;
  resterendeProsentSpan.textContent = `${resterendeProsent}%`;
  resterendeProsentSpan.style.color = resterendeProsent === 0 ? '#28a745' : '#007bff';
}

// ===================================================================
//  LYTTERE
// ===================================================================
hamburgerKnapp.addEventListener('click', () => {
  mobilMeny.classList.toggle('apen');
  hamburgerKnapp.classList.toggle('apen');
});
beregnKnapp.addEventListener('click', beregnOverskudd);
tomSkjemaKnapp.addEventListener('click', tomHeleSkjemaet);
document.querySelectorAll('.utgifts-checkbox').forEach(aktiverCheckboxLytter);
document.querySelectorAll('input').forEach(input => {
    if (input.type !== 'range') {
        input.addEventListener('input', lagreBudsjett);
    }
});
document.getElementById('leggTilFastUtgift').addEventListener('click', () => leggTilNyUtgiftsrad(document.getElementById('utgiftsListe')));
document.getElementById('leggTilVariabelUtgift').addEventListener('click', () => leggTilNyUtgiftsrad(document.getElementById('variabelUtgiftsListe')));
alleSlidere.forEach(slider => {
    slider.addEventListener('input', () => oppdaterFordeling(slider));
    slider.addEventListener('change', lagreBudsjett); // Lagrer kun når man slipper slideren
});