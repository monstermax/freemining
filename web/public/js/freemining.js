
function toggleDarkMode(colorScheme) {
    if (! colorScheme) {
        const currentMode = (document.documentElement.style.colorScheme == 'dark') ? 'dark' : 'light';
        colorScheme = (currentMode == 'dark') ? 'light' : 'dark';
    }
    document.documentElement.style.colorScheme = colorScheme;
    document.querySelector('meta[name="color-scheme"]').content = document.documentElement.style.colorScheme;
    window.localStorage.setItem('colorScheme', colorScheme);

    if (colorScheme === 'dark') {
        jQuery('body').addClass('dark');
    } else {
        jQuery('body').removeClass('dark');
    }

    const colorIcon = (colorScheme == 'dark') ? '🌞' : '🌙';
    jQuery('.dark-icon').text(colorIcon);
}
