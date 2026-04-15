document.addEventListener("DOMContentLoaded", () => {
    let currentTimer = null;

    // Default configuration (User is born on 1996-12-02 06:10, Retire 63, Life 80)
    let config = {
        birthDate: "1996-12-02T06:10",
        retireAge: 63,
        lifeExpectancy: 80
    };

    // Load from local storage
    try {
        const saved = localStorage.getItem("lifeTimerConfig");
        if (saved) {
            config = JSON.parse(saved);
        }
    } catch(e) {
        console.error("Failed to parse config from localStorage");
    }

    const birthInput = document.getElementById("input-birth");
    const retireInput = document.getElementById("input-retire");
    const lifeInput = document.getElementById("input-life");

    birthInput.value = config.birthDate;
    retireInput.value = config.retireAge;
    lifeInput.value = config.lifeExpectancy;

    function calculateDiff(start, end) {
        if (end < start) return { y: 0, m: 0, d: 0, h: 0, min: 0, s: 0, total: 0 };
        
        let startD = new Date(start);
        let endD = new Date(end);

        let y = endD.getFullYear() - startD.getFullYear();
        let m = endD.getMonth() - startD.getMonth();
        let d = endD.getDate() - startD.getDate();
        let h = endD.getHours() - startD.getHours();
        let min = endD.getMinutes() - startD.getMinutes();
        let s = endD.getSeconds() - startD.getSeconds();

        if (s < 0) { s += 60; min--; }
        if (min < 0) { min += 60; h--; }
        if (h < 0) { h += 24; d--; }
        if (d < 0) {
            let tempDate = new Date(endD.getFullYear(), endD.getMonth(), 0);
            d += tempDate.getDate();
            m--;
        }
        if (m < 0) { m += 12; y--; }

        return { y, m, d, h, min, s, total: endD.getTime() - startD.getTime() };
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    }

    let isFirstRender = true;

    function updateDOM() {
        const now = new Date();
        const birth = new Date(config.birthDate);
        if(isNaN(birth.getTime())) return;

        const retire = new Date(birth);
        retire.setFullYear(birth.getFullYear() + parseInt(config.retireAge));
        
        const lifeEnd = new Date(birth);
        lifeEnd.setFullYear(birth.getFullYear() + parseInt(config.lifeExpectancy));

        // Lived
        const lived = calculateDiff(birth, now);
        updateBlock("l-y", lived.y);
        updateBlock("l-m", lived.m);
        updateBlock("l-d", lived.d);
        updateBlock("l-h", lived.h);
        updateBlock("l-min", lived.min);
        updateBlock("l-s", lived.s);

        // Retire
        const retireDiff = calculateDiff(now, retire);
        updateBlock("r-y", retireDiff.y);
        updateBlock("r-m", retireDiff.m);
        updateBlock("r-d", retireDiff.d);
        updateBlock("r-h", retireDiff.h);
        updateBlock("r-min", retireDiff.min);
        updateBlock("r-s", retireDiff.s);

        // Life
        const lifeDiff = calculateDiff(now, lifeEnd);
        updateBlock("d-y", lifeDiff.y);
        updateBlock("d-m", lifeDiff.m);
        updateBlock("d-d", lifeDiff.d);
        updateBlock("d-h", lifeDiff.h);
        updateBlock("d-min", lifeDiff.min);
        updateBlock("d-s", lifeDiff.s);

        // Progress bars
        const livedMs = now.getTime() - birth.getTime();

        const retireTotal = retire.getTime() - birth.getTime();
        let retirePercent = (livedMs / retireTotal) * 100;
        retirePercent = Math.max(0, Math.min(100, retirePercent));
        document.getElementById("retire-progress").style.width = retirePercent + "%";
        document.getElementById("retire-percentage").innerText = retirePercent.toFixed(6) + "%";

        const lifeTotal = lifeEnd.getTime() - birth.getTime();
        let lifePercent = (livedMs / lifeTotal) * 100;
        lifePercent = Math.max(0, Math.min(100, lifePercent));
        document.getElementById("life-progress").style.width = lifePercent + "%";
        document.getElementById("life-percentage").innerText = lifePercent.toFixed(6) + "%";
        
        isFirstRender = false;
    }

    function updateBlock(id, val) {
        const el = document.getElementById(id);
        if(isFirstRender && val > 0) {
            animateValue(el, 0, val, 1000);
        } else {
            el.innerText = val;
        }
    }

    function startTimer() {
        if (currentTimer) clearInterval(currentTimer);
        isFirstRender = true;
        updateDOM();
        currentTimer = setInterval(updateDOM, 1000);
    }

    startTimer();

    // Modal Logic
    const modal = document.getElementById("settings-modal");
    const settingsBtn = document.getElementById("settings-btn");
    const closeBtn = document.getElementById("close-modal");
    const saveBtn = document.getElementById("save-settings");

    settingsBtn.addEventListener("click", () => {
        modal.classList.add("active");
    });

    closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    });

    saveBtn.addEventListener("click", () => {
        if(!birthInput.value) {
            alert("请选择出生时间");
            return;
        }
        
        config.birthDate = birthInput.value;
        config.retireAge = retireInput.value || 63;
        config.lifeExpectancy = lifeInput.value || 80;
        
        localStorage.setItem("lifeTimerConfig", JSON.stringify(config));
        modal.classList.remove("active");
        startTimer();
    });
});
