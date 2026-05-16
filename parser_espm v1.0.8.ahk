; /**
;  * @file parser_espm_refactor.ahk
;  * @version 1.0.8
;  * @description Aplikasi AutoHotkey v2 dengan antarmuka WebView2, splash screen, dan konfigurasi dinamis.
;  * @author [Nama Anda]
;  * @requires AutoHotkey v2.1-alpha.3
;  * @requires Gdip_All.ahk
;  * @requires WebViewToo.ahk
;  * @requires JSON.ahk (harus kompatibel dengan AHK v2)
;  */

#Requires AutoHotkey >= v2.1-alpha.3
#Warn All, Off
#Warn VarUnset, Off
#SingleInstance Force
Gui.ProtoType.AddWebViewCtrl := WebViewCtrl

; Set direktori kerja ke direktori skrip
SetWorkingDir A_ScriptDir

; Include pustaka eksternal
#Include Lib\Gdip_All.ahk       ; Library GDI+ untuk manipulasi grafis
#Include Lib\WebViewToo.ahk     ; Library WebView2 untuk antarmuka HTML
#Include Lib\JSON.ahk           ; Library JSON parser (harus memiliki Jxon_Load)

; -----------------------------------------------------------
/**
 * @constant default_config
 * Konfigurasi dasar sistem aplikasi
 * Nilai-nilai ini dapat disalin ke `configSys` untuk dipakai dan dimodifikasi saat runtime.
 */
default_config := Map(
    "colorText", "FF0000",               ; Warna teks (hex)
    "transcolorText", "FF",              ; Transparansi teks
    "color", "FFFFFF",                   ; Warna latar belakang
    "transcolor", "C0",                  ; Transparansi latar belakang
    "Debug", 1,                          ; Mode debug (1=aktif, 0=nonaktif)
    "pathMode", "BASE64",                ; Mode path (contoh: BASE64 atau SetWorkingDir)
    "sleep", 200,                        ; Delay default (ms)
    "maxDim", 1280,                      ; Ukuran maksimum gambar
    "font", "Segoe UI",                  ; Font default
    "fontSize", 24,                      ; Ukuran font
    "paddingText", 10,                   ; Padding teks
    "heightRectangle", 65,              ; Tinggi area teks
    "filenameFormat", ["id", "lokasi"], ; Format nama file ekspor
    "pathDownload", ".\img_download",   ; Path folder unduhan
    "pathExport", ".\img_export"        ; Path folder ekspor
)

; Buat salinan konfigurasi global dari default
global configSys := default_config.Clone() ; Untuk runtime, agar bisa direset ke default jika diperlukan
global configPath := A_ScriptDir "\config.json"
global ESPMWindow, ESPMWebView
global ESPM_Toolbar
global WebViewSettings := {}
global StartTime := 0

; Tambahkan skrip ini ke dalam grup skrip (berguna untuk manipulasi grup window)
GroupAdd("ScriptGroup", "ahk_pid" DllCall("GetCurrentProcessId"))

; -----------------------------------------------------------
; Tampilkan splash screen sederhana selama proses inisialisasi
splash := Gui("+AlwaysOnTop -Caption +ToolWindow")
splash.BackColor := "White"
splash.SetFont("s14", "Segoe UI")
splash.AddText("cBlue Center w300", "🚀 Memuat aplikasi...")
splash.Show("AutoSize Center")

; -----------------------------------------------------------
/**
 * @function WebView2 Initialization
 * Inisialisasi WebView2 dengan pengaturan loader DLL khusus jika dikompilasi.
 */
if (A_IsCompiled) {
    ; Daftar file yang akan diproses
    files := ["index.html", "index.js", "style.css"]

    for fileName in files {
        filePath := A_ScriptDir "\" fileName

        if FileExist(filePath) {
            FileSetAttrib("-RSH", filePath) ; Lepas atribut agar bisa dihapus
            FileDelete(filePath)
        }

        ; Ekstrak ulang dari Resource
        WebViewCtrl.CreateFileFromResource(fileName, A_ScriptDir)

        ; Set kembali menjadi Read-only, System, dan Hidden
        FileSetAttrib("+RSH", filePath)
    }

    ; ===== config.json =====
    if !FileExist(configPath) {
        WebViewCtrl.CreateFileFromResource("config.json", A_ScriptDir)  ; Hanya jika belum ada
    }

    WebViewCtrl.CreateFileFromResource((A_PtrSize * 8) "bit\WebView2Loader.dll", WebViewCtrl.TempDir)
    WebViewSettings := {
        DllPath: WebViewCtrl.TempDir "\" (A_PtrSize * 8) "bit\WebView2Loader.dll",
        VirtualHostNameToFolderMapping: [{
            HostName: "ahk.localhost",
            FolderPath: A_ScriptDir,
            AccessKind: 1 ; Izinkan akses resource
        }
        ]
    }
} else {
    WebViewSettings := {} ; Gunakan loader default (dari sistem)
}

; -----------------------------------------------------------
/**
 * @object MyWindow
 * Objek GUI WebView2 utama yang menampilkan file HTML dan menerima callback dari JavaScript.
 */
MyWindow := WebViewGui("+Resize", , , WebViewSettings)
MyWindow.OnEvent("Close", (*) => ExitApp()) ; Keluar saat window ditutup

ESPMWindow := Gui("+Resize", "eSPM BPJT PU – 🧠 Web Scraping ")
ESPMWindow.BackColor := "F5F7FA"
ESPMWindow.SetFont("s10", "Segoe UI")

ESPMWindow.OnEvent("Size", OnESPMResize)
; ESPMWindow := WebViewGui("+Resize", "eSPM – Text Mining", , WebViewSettings)

; ===== TOOLBAR =====
ESPM_Toolbar := ESPMWindow.AddText(
    "xm ym w900 h40 BackgroundFFFFFF 0x200"
)

btnGo := ESPMWindow.AddButton(
    "x780 y3 w200 h30 vNavigateButton",
    "🧠 Auto Scroll && Web Scraping"
)

btnGo.SetFont("s9 Bold")
btnGo.OnEvent("Click", ESPM_TextMining)

btnStop := ESPMWindow.AddButton("x780 y3 w200 h30 vStopButton Backgroundred", "Stop Scraping")
btnStop.OnEvent("Click", StopScraping)
btnStop.Visible := false

ESPMWebView := ESPMWindow.AddWebViewCtrl(
    "xm w900 h700 vWVToo",
    WebViewSettings
)
; Ganti url.espm.go.id dengan url laporan tindak lanjut selft assesment
ESPMWebView.Navigate("url.espm.go.id")
ESPMWebView.AddCallbackToScript("message", WebViewMessageHandler)

; -----------------------------------------------------------
; Map folder lokal ke host virtual agar bisa diakses dari HTML
MyWindow.CoreWebView2.SetVirtualHostNameToFolderMapping(
    "ahk.localhost", ; Host virtual
    A_ScriptDir,     ; Folder root lokal
    1                ; Izinkan akses (COREWEBVIEW2_HOST_RESOURCE_ACCESS_KIND_ALLOW)
)

; -----------------------------------------------------------
; Jalankan setelah delay agar WebView siap, lalu tampilkan GUI utama
SetTimer () => (
    splash.Destroy(),                            ; Hapus splash screen
    ; MyWindow.Navigate("https://espm.bpjt.pu.go.id/v1-satemuan"),             ; Navigasi ke antarmuka HTML
    MyWindow.Navigate("http://ahk.localhost/index.html"),             ; Navigasi ke antarmuka HTML
    MyWindow.AddCallbackToScript("SubmitJson", WebJsonEvent), ; Callback untuk JSON dari JavaScript
    MyWindow.AddCallbackToScript("message", WebViewMessageHandler),
    MyWindow.Show("w900 h600")                   ; Tampilkan jendela utama
), -1000 ; Delay 1 detik

; -----------------------------------------------------------
; Aktifkan mode debug jika diset dalam konfigurasi
configSys := LoadJson(configPath)

if (configSys["Debug"] = 1) {
    MyWindow.Debug()
}
return

OnESPMResize(gui, minMax, width, height) {
    ; Abaikan saat minimize
    if (minMax = -1)
        return

    margin := 10
    btnW := 200
    btnH := 30
    toolbarH := 40

    ; Tombol pojok kanan atas
    gui["NavigateButton"].Move(
        width - btnW - margin,
        margin,
        btnW,
        btnH
    )
    gui["StopButton"].Move(
        width - btnW - margin,
        margin,
        btnW,
        btnH
    )

    ; Toolbar lebar mengikuti window
    ESPM_Toolbar.Move(0, 0, width, toolbarH)

    ; WebView resize otomatis
    gui["WVToo"].Move(
        0,
        toolbarH + 5,
        width,
        height - toolbarH - 5
    )
}

WebViewMessageHandler(WebView, Message) {
    ; MsgBox(Message, 'WebViewMessageHandler')
    if !InStr(Message, "{")
        return
    try {
        msg := JSON.Parse(Message)

        switch msg.Get("cmd", "") {

            case "open_espm":
                OpenESPMWindow()

            case "espm_body":
                ProcessESPMHtml(msg['html'])

            case "btnGo":
                ProcessButton()
        }
    } catch as e {
        MsgBox "WebViewMessageHandler error:`n" e.Message
    }
}

ProcessButton(*) {
    ; MsgBox("aye")
    global ESPMWebView
    SetTimer(UpdateClock, 0)
    btnGo.Enabled := true
    btnGo.Visible := true
    btnStop.Visible := false
    ; Ganti 'wv' dengan nama variabel WebView2 Anda
    ESPMWebView.ExecuteScriptAsync('if (window.scrapingTimer) { clearInterval(window.scrapingTimer); }')
    ; Aktifkan kembali tombol Go jika sebelumnya di-disable
    btnGo.Enabled := true
}

ProcessESPMHtml(html) {
    global MyWindow

    count := CountCardDblock(html)

    ; MsgBox(html, 'ProcessESPMHtml : ' count ' data')
    ; tampilkan ke user
    ToolTip "Detected .listmon : " count
    SetTimer(() => ToolTip(), -1500)

    ; kirim ke MyWindow untuk diparse
    SendToMain(html, count)
}


CountCardDblock(html) {
    pos := 1
    total := 0

    while RegExMatch(html, '<div[^>]*class\s*=\s*["`'][^"`']*\bcard\b[^"`']*\bd-block\b[^"`']*["`']', &m, pos) {
        total++
        pos := m.Pos + m.Len
    }
    return total
}


SendToMain(html, count) {
    global MyWindow

    js :=
    (
        "ahk.message(JSON.stringify({"
        "  cmd: 'espm_html',"
        "  count: " count ","
        "  html: " html
        "}));"
    )

    MyWindow.PostWebMessageAsJson(JSON.stringify({ cmd: 'espm_html', count: count, html: html }))
    ; MsgBox('asu')
    btnGo.Enabled := true
    btnGo.Visible := true
    btnStop.Visible := false
    ESPMWindow.Hide()
}


OpenESPMWindow() {
    global ESPMWindow, ESPMWebView, WebViewSettings

    if IsObject(ESPMWindow) {
        ESPMWindow.Show("w900 h700 Center")
        return
    }

    ESPMWindow := Gui("+Resize", "eSPM – Text Mining")
    ESPMWindow.BackColor := "F5F7FA"
    ESPMWindow.SetFont("s10", "Segoe UI")

    ; JANGAN Destroy()
    ESPMWindow.OnEvent("Close", ESPMWindow_Close)
    ; ESPMWindow.OnEvent("Size", OnESPMResize)

    ; ===== TOOLBAR =====
    ESPMWindow.AddText("xm ym w900 h40 BackgroundFFFFFF 0x200")

    btnGo := ESPMWindow.AddButton(
        "x780 y3 w110 h30 vNavigateButton",
        "🧠 Web Scraping"
    )
    btnGo.SetFont("s9 Bold")
    btnGo.OnEvent("Click", ESPM_TextMining)

    btnStop := ESPMWindow.AddButton("x780 y3 w200 h30 vStopButton Backgroundred", "Stop Scraping")
    btnStop.OnEvent("Click", StopScraping)
    btnStop.Visible := false

    ESPMWebView := ESPMWindow.AddWebViewCtrl(
        "xm y40 w900 h660 vWVToo",
        WebViewSettings
    )

    ESPMWebView.AddCallbackToScript("message", WebViewMessageHandler)
    ESPMWebView.Navigate("https://espm.bpjt.pu.go.id/v1-satemuan")

    ESPMWindow.Show("w900 h700 Center")
}

ESPMWindow_Close(gui) {

    global ESPMWebView
    SetTimer(UpdateClock, 0)
    btnGo.Enabled := true
    btnGo.Visible := true
    btnStop.Visible := false
    ; Ganti 'wv' dengan nama variabel WebView2 Anda
    ESPMWebView.ExecuteScriptAsync('if (window.scrapingTimer) { clearInterval(window.scrapingTimer); }')
    ; Aktifkan kembali tombol Go jika sebelumnya di-disable
    btnGo.Enabled := true
    gui.Hide()
}

UpdateClock() {
    global StartTime

    ; Hitung selisih dalam milidetik
    elapsed := A_TickCount - StartTime

    ; Konversi milidetik ke jam, menit, detik
    s := Floor(elapsed / 1000)
    hh := Floor(s / 3600)
    mm := Floor(Mod(s, 3600) / 60)
    ss := Mod(s, 60)

    ; Format agar selalu 2 digit (00:00:00)
    btnStop.Text := "⛔ Stop [" Format("{1:02}:{2:02}:{3:02}", hh, mm, ss) "]"
}

StopScraping(*) {
    global ESPMWebView
    SetTimer(UpdateClock, 0)
    btnGo.Enabled := true
    btnGo.Visible := true
    btnStop.Visible := false
    ; Ganti 'wv' dengan nama variabel WebView2 Anda
    ESPMWebView.ExecuteScriptAsync('window.stopAutoScroll = true;')
    ; Aktifkan kembali tombol Go jika sebelumnya di-disable
    btnGo.Enabled := true
    ESPMWebView := ""
    MsgBox("StopScraping")
}

ESPM_TextMining(*) {
    global ESPMWebView
    global StartTime

    ; Set waktu mulai sekarang
    StartTime := A_TickCount

    btnGo.Enabled := false
    btnGo.Visible := false
    btnStop.Visible := true

    SetTimer(UpdateClock, 1000)

    js :=
    (
        "(async () => { window.stopAutoScroll = false;  window.addEventListener('keydown', e=>{ if(e.key === 'Escape'){ window.stopAutoScroll = true; console.warn('⛔ Stop by ESC'); } });  function sleep(ms){ return new Promise(r => setTimeout(r, 1 + Math.random()*ms)); };  function findScrollable(){ if (!document.getElementById('chkdate')?.checked) { alert('❌ Silakan centang tanggal dan cari terlebih dahulu');  ahk.message(JSON.stringify({ cmd: 'btnGo', btn: true }));  return null;  }; let best = null; document.querySelectorAll('*').forEach(el=>{ if(el.scrollHeight > el.clientHeight + 100){ if(!best || el.scrollHeight > best.scrollHeight){ best = el; } } }); return best; };  function itemCount(){ return document.querySelectorAll('.card').length; };  let container = findScrollable();  if(!container){ console.warn('❌ Container scroll tidak ditemukan'); return; };  console.warn('✅ Container ditemukan:', container);  let last = itemCount(); let idle = 0;  while(!window.stopAutoScroll){  for(let i=0;i<5;i++){ if(window.stopAutoScroll) break; container.scrollBy(0, 400); container.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('scroll')); await sleep(200); };  await sleep(2000);  let now = itemCount();  if(now === last){ idle++; }else{ idle = 0; last = now; console.warn('📈 Item:', now); }  if(idle >= 3){ console.warn('✅ Scroll selesai');  if(window.ahk){ ahk.message(JSON.stringify({ cmd:'espm_body', html: document.querySelector('#listmon')?.innerHTML })); }  break; } }  })();"
    )

    ESPMWebView.ExecuteScriptAsync(js)
    ; ESPMWebView.ExecuteScript(js)
    ; MsgBox(js, 'ESPMWebView.ExecuteScript')
}


; =========================================================================
; Hotkeys Section - Hanya aktif saat jendela termasuk dalam ScriptGroup
; =========================================================================

/**
 * @hotkey F1
 * Klik tab "#howto-tab" di antarmuka HTML.
 */
#HotIf WinActive("ahk_group ScriptGroup")
F1:: {
    MyWindow.ExecuteScriptAsync("$('#howto-tab').click()")
}

/**
 * @hotkey F2
 * Kirim pesan bolak-balik ke WebView (string dan JSON) sebagai contoh komunikasi.
 */
F2:: {
    static Toggle := 0
    Toggle := !Toggle
    if (Toggle) {
        MyWindow.PostWebMessageAsString("Hello World")
    } else {
        MyWindow.PostWebMessageAsJson('{"key1": "value1"}')
    }
}

/**
 * @hotkey F3
 * Memuat ulang konfigurasi dari file.
 */
F3:: {
    LoadConfigFromFile()
    ; Jika ingin, tambahkan: MyWindow.PostWebMessageAsJson(...) untuk kirim ulang config
}

/**
 * @hotkey F5
 * Navigasi ulang ke halaman index.html.
 */
F5:: {
    MyWindow.Navigate("http://ahk.localhost/index.html")
}

/**
 * @hotkey Ctrl + F5
 * Sama dengan F5, memuat ulang halaman utama.
 */
^F5:: {
    MyWindow.Navigate("http://ahk.localhost/index.html")
}

/**
 * @hotkey F9
 * Aktifkan mode debug WebView (developer tools).
 */
F9:: {
    MyWindow.Debug()
}

/**
 * @hotkey Ctrl + ESC
 * Keluar dari aplikasi secara langsung.
 */
^ESC:: {
    ExitApp
}
#HotIf

/**
 * @global data
 * Variabel global untuk menyimpan payload data terakhir dari WebView (jika diperlukan secara umum).
 */
data := ""

/**
 * @function WebJsonEvent
 * Callback yang dipanggil dari WebView (JavaScript) melalui `PostWebMessageAsJson`.
 * Menangani berbagai aksi yang dikirim dari HTML, seperti:
 * - Menyimpan konfigurasi
 * - Men-trigger unduhan gambar
 * - Mengirim ulang konfigurasi saat diminta
 * 
 * @param WebView {Object} Referensi ke WebView pengirim pesan
 * @param Message {String} JSON string dari WebView
 */
WebJsonEvent(WebView, Message) {
    global configSys

    try {
        ; Parse JSON sebagai Map
        obj := JSON.parse(Message, false, true)
        action := obj.Get("action", "")
        data := obj.Get("data", Map())

        if (action = "config") {
            ; Simpan konfigurasi baru
            SaveJsonToDisk(data, "config.json")
            LoadConfigFromFile()
            return true

        } else if (action = "download") {
            ; Simpan manifest dan mulai unduhan gambar
            try FileDelete "manifestPath.json"
            FileAppend JSON.stringify(data), "manifestPath.json", "UTF-8"
            DownloadImages(data)
            return true

        } else if (action = "request_config") {
            ; Kirim ulang konfigurasi saat diminta dari WebView
            LoadConfigFromFile()
            packet := Map("type", "config", "data", configSys.Clone())
            MyWindow.PostWebMessageAsJson(JSON.stringify(packet))
        }

    } catch Error as e {
        MsgBox "Error: " e.Message
    }
}

; @function LoadConfigFromFile
; @description Memuat konfigurasi dari file JSON dan mengupdate variabel global `configSys`.
; @param fileName {String} Nama file konfigurasi (default: "config.json").
; @returns {Boolean} True jika sukses, False jika gagal lalu gunakan default_config.
LoadConfigFromFile(fileName := "config.json") {
    global configSys, default_config

    fullPath := A_ScriptDir "\" fileName
    try {
        if !FileExist(fullPath)
            throw Error("File config tidak ditemukan.")

        jsonStr := FileRead(fullPath, "UTF-8")
        parsed := JSON.Parse(jsonStr)

        configSys := default_config.Clone()
        for key, val in parsed
            configSys[key] := val

        ; Kirim ke WebView setelah selesai parsing
        packet := Map("type", "config", "data", configSys.Clone())
        MyWindow.PostWebMessageAsJson(JSON.stringify(packet))

        TrayTip "Config", "Config berhasil dimuat dari " fileName, 2
        ; MsgBox(JSON.stringify(configSys))
        return true
    } catch as e {
        TrayTip "Config Error", e.Message . "`nGunakan default_config", 3
        A_Clipboard := e.Message
        configSys := default_config.Clone()
        return false
    }
}

; @function GetImageOrientation
; @description Membaca orientasi gambar dari metadata menggunakan WIA.
; @param imgPath {String} Path ke file gambar.
; @returns {Integer} Nilai orientasi (1=normal, 6=rotate 90, 8=rotate 270).
GetImageOrientation(imgPath) {
    try {
        img := ComObject("WIA.ImageFile")
        img.LoadFile(imgPath)
        for prop in img.Properties {
            if (prop.Name = "Orientation") {
                return prop.Value  ; 1 = normal, 6 = rotate 90, 8 = rotate 270
            }
        }
    } catch as e {
        return 1  ; fallback ke normal
    }
    return 1
}

; @function DownloadFile
; @description Mendownload file dari URL ke path lokal jika belum ada.
; @param url {String} URL file yang akan diunduh.
; @param savePath {String} Lokasi tujuan penyimpanan file.
; @returns {Boolean} True jika sukses, False jika gagal.
DownloadFile(url, savePath) {
    ; ✅ Jika file sudah ada, skip download
    if FileExist(savePath)
        return true

    ; ✅ Pastikan folder tujuan ada
    SplitPath(savePath, , &dir)
    if !DirExist(dir)
        DirCreate(dir)

    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        whr.Open("GET", url, false) ; Sinkron
        whr.Send()

        ; ✅ Cek status code
        if (whr.Status != 200)
            return false

        ; ✅ Ambil ResponseBody
        data := whr.ResponseBody
        if !data || ComObjType(data) != 8209  ; 8209 = VT_ARRAY | VT_UI1 (byte array)
            return false

        ; ✅ Simpan ke file
        stream := ComObject("ADODB.Stream")
        stream.Type := 1 ; Binary
        stream.Open()
        stream.Write(data)
        stream.SaveToFile(savePath, 2) ; 2 = Overwrite
        stream.Close()

        return true
    } catch as e {
        MsgBox "❌ Gagal download:`n" e.Message
        return false
    }
    Sleep configSys.sleep
}

; @function DownloadImages
; @description Mendownload dan memproses daftar gambar dari array JSON, lalu update ke WebView.
; @param dataArray {Array} Array berisi data gambar (Map).
DownloadImages(dataArray) {
    global configSys  ; gunakan konfigurasi global

    if !(Type(dataArray) ~= "Map|Object|Array") {
        MsgBox "Gagal: Tipe data tidak valid. Tipe: " Type(dataArray)
        return
    }

    Loop dataArray.Length {
        item := dataArray[A_Index]
        url := item["url"]
        no := item["no"]
        imgName := item["fileName"]
        imgTanggal := RegExReplace(item["tanggal"], "(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})", "$1$2$3$4$5$6")
        tanggal := FormatTime(imgTanggal, "dd MMM yyyy")
        latlong := item["latlng"]  ; Default jika belum tersedia

        MyWindow.ExecuteScriptAsync(Format("renderCardsWithDelay('proccess', {}, {}, {}, {})"
            , A_Index
            , dataArray.Length
            , no
            , JSEscape(imgName)
        ))

        ; Tentukan path download
        downloadPath := StrReplace(configSys["pathDownload"] "\" imgName ".jpg", "\\", "\")

        ; Download gambar
        if !DownloadFile(url, downloadPath) {
            ; Update kartu di HTML
            MyWindow.ExecuteScriptAsync(Format("renderCardsWithDelay('failed', {}, {}, {}, {}, {})"
                , A_Index
                , dataArray.Length
                , no
                , JSEscape(imgName)
                , JSEscape(outputPath)
            ))

            MsgBox "Gagal download gambar dari: " url
            continue
        }

        ; Kompres dan tambahkan overlay
        outputPath := CompressAndOverlayImage(downloadPath, tanggal, latlong, imgName)
        configSys.pathMode := configSys["pathMode"]


        ; MsgBox(outputPath,"#1")
        outputPath := RegExReplace(outputPath, "\\Pages", "")
        ; MsgBox(outputPath,"#2")

        if (configSys.pathMode = "SetWorkingDir") {
            if (A_IsCompiled) {
                ; Saat EXE: gunakan file:/// (agar WebView bisa load via file URI)
                outputPath := "file:///" . encodeURIComponent(StrReplace(outputPath, "\", "/"))
            } else {
                ; Saat masih .ahk: relatif ke SetWorkingDir
                outputPath := encodeURIComponent(StrReplace(StrReplace(outputPath, A_ScriptDir), "\", "/"))
            }

        } else if (configSys.pathMode = "LoadFilePath") {
            if (A_IsCompiled) {
                ; Saat EXE: pakai virtual host mapping
                outputPath := "http://ahk.localhost" . encodeURIComponent(StrReplace(StrReplace(outputPath, A_ScriptDir), "\", "/"))
            } else {
                ; Saat .ahk: tetap gunakan path asli dari pathExport
                outputPath := encodeURIComponent(StrReplace(StrReplace(outputPath, A_ScriptDir), "\", "/"))
            }

        } else if (configSys.pathMode = "BASE64") {
            outputPath := "data:image/jpeg;base64," . FileToBase64(outputPath)
        }

        ; Update kartu di HTML
        if (configSys.pathMode = "BASE64") {
            MyWindow.PostWebMessageAsJson(JSON.stringify({
                action: "updateCard",
                index: A_Index,
                total: dataArray.Length,
                no: no,
                fileName: imgName,
                base64: outputPath
            }))
        } else {
            MyWindow.ExecuteScriptAsync(Format("renderCardsWithDelay('done', {}, {}, {}, {}, {})"
                , A_Index
                , dataArray.Length
                , no
                , JSEscape(imgName)
                , JSEscape(outputPath)
            ))
        }
    }

    MyWindow.ExecuteScriptAsync("renderCardsWithDelay('finish', 0, 0, 0, 'null')")
}

; @function JSEscape
; @description Escape karakter khusus untuk digunakan dalam string JavaScript.
; @param val {String} Teks yang ingin di-escape.
; @returns {String} Teks dengan escape karakter.
JSEscape(val) {
    return '"' StrReplace(StrReplace(val, "\", "\\"), '"', '\"') '"'
}

; @function Gdip_RotateImage
; @description Melakukan rotasi bitmap menggunakan GDI+ berdasarkan sudut.
; @param pBitmap {Ptr} Handle bitmap.
; @param angle {Integer} Sudut rotasi (90, 180, 270).
; @returns {Ptr} Bitmap yang sudah dirotasi.
Gdip_RotateImage(pBitmap, angle) {

    width := Gdip_GetImageWidth(pBitmap)
    height := Gdip_GetImageHeight(pBitmap)

    if (angle = 90 or angle = 270)
        pRotated := Gdip_CreateBitmap(height, width)
    else
        pRotated := Gdip_CreateBitmap(width, height)

    G := Gdip_GraphicsFromImage(pRotated)
    Gdip_SetSmoothingMode(G, 4)
    Gdip_SetInterpolationMode(G, 7)

    ; Rotasi sesuai titik pusat baru
    if (angle = 90) {
        Gdip_TranslateWorldTransform(G, height, 0)
    } else if (angle = 180) {
        Gdip_TranslateWorldTransform(G, width, height)
    } else if (angle = 270) {
        Gdip_TranslateWorldTransform(G, 0, width)
    }
    Gdip_RotateWorldTransform(G, angle)

    ; Gambar gambar asli pada koordinat (0,0) dari kanvas baru
    Gdip_DrawImage(G, pBitmap, 0, 0, width, height)

    Gdip_DeleteGraphics(G)
    Gdip_DisposeImage(pBitmap)

    return pRotated
}

; @function CompressAndOverlayImage
; @description Resize gambar, tambahkan overlay teks, dan simpan hasilnya.
; @param imgPath {String} Path gambar asli.
; @param tanggal {String} Teks tanggal overlay.
; @param latlong {String} Teks lokasi overlay.
; @param imgName {String} Nama file untuk output.
; @returns {String} Path file hasil.
CompressAndOverlayImage(imgPath, tanggal, latlong, imgName) {
    global configSys
    pToken := Gdip_Startup()
    if !pToken {
        MsgBox "Gagal memulai GDI+"
        return
    }
    ; Load gambar asli
    pBitmap := Gdip_CreateBitmapFromFile(imgPath)
    orientation := GetImageOrientation(imgPath)
    if (orientation = 6) ; rotate 90 clockwise
        pBitmap := Gdip_RotateImage(pBitmap, 90)
    else if (orientation = 8) ; rotate 270 clockwise (90 counter-clockwise)
        pBitmap := Gdip_RotateImage(pBitmap, 270)
    else if (orientation = 3) ; upside down
        pBitmap := Gdip_RotateImage(pBitmap, 180)
    if !pBitmap {
        MsgBox "Gagal memuat gambar: " imgPath
        Gdip_Shutdown(pToken)
        return
    }
    width := Gdip_GetImageWidth(pBitmap)
    height := Gdip_GetImageHeight(pBitmap)
    ; Font dan ukuran
    maxDim := configSys["maxDim"]
    font := configSys["font"]
    fontSize := configSys["fontSize"]
    transcolor := configSys.Has("transcolor") ? configSys["transcolor"] : "FF"
    color := (configSys["color"] != "") ? configSys["color"] : "FFFFFF"
    transcolorText := configSys.Has("transcolorText") ? configSys["transcolorText"] : "FF"
    colorText := (configSys["colorText"] != "") ? configSys["colorText"] : "000000"
    paddingText := configSys["paddingText"]
    heightRectangle := configSys["heightRectangle"]
    pathExport := configSys["pathExport"]
    if (width > height && width > maxDim) {
        ratio := maxDim / width
        newW := maxDim
        newH := Round(height * ratio)
    } else if (height >= width && height > maxDim) {
        ratio := maxDim / height
        newH := maxDim
        newW := Round(width * ratio)
    } else {
        newW := width
        newH := height
    }
    ; Resize image
    pResized := Gdip_CreateBitmap(newW, newH)
    G := Gdip_GraphicsFromImage(pResized)
    Gdip_SetSmoothingMode(G, 4)
    Gdip_DrawImage(G, pBitmap, 0, 0, newW, newH)
    Gdip_DeleteGraphics(G)
    Gdip_DisposeImage(pBitmap)
    pBitmap := pResized

    ; ===================== SCALE OVERLAY =====================
    scaleFactor := newW / maxDim

    fontSize := Round(fontSize * scaleFactor)
    paddingText := Round(paddingText * scaleFactor)
    heightRectangle := Round(heightRectangle * scaleFactor)

    ; Batas minimum biar tetap kebaca
    if (fontSize < 14)
        fontSize := 14
    if (paddingText < 10)
        paddingText := 10
    if (heightRectangle < 40)
        heightRectangle := 40

    ; Buat overlay teks
    G := Gdip_GraphicsFromImage(pBitmap)
    Gdip_SetTextRenderingHint(G, 5)
    ; ===================== TANGGAL (KIRI BAWAH) =======================
    text1 := tanggal
    text2 := latlong "`nRuas Tol Jombang-Mojokerto"

    width1 := (newW // 2) - paddingText
    height1 := heightRectangle

    x1 := paddingText
    y1 := newH - height1 - paddingText

    width2 := width1
    height2 := heightRectangle

    x2 := newW - width2 - paddingText
    y2 := y1

    argbHex := "0x" . transcolor . color
    bgBrush2 := Gdip_BrushCreateSolid(argbHex)
    Gdip_FillRectangle(G, bgBrush2, x1, y1, newW - (paddingText * 2), heightRectangle)
    Gdip_DeleteBrush(bgBrush2)
    argbHex := ("0x" . transcolorText . colorText)
    options1 := "x" x1 " y" y1 " w" width1 " h" height1 " c" argbHex " r4 s" fontSize
    options2 := "x" x2 " y" y2 " w" width2 " h" height2 " c" argbHex " r4 s" fontSize " Right"

    Gdip_TextToGraphics(G, text1, options1, font, width1, height1)
    Gdip_TextToGraphics(G, text2, options2, font, width2, height2)
    Gdip_DeleteGraphics(G)
    ; Buat folder jika belum ada
    outDir := A_ScriptDir "\" pathExport
    if !DirExist(outDir)
        DirCreate(outDir)
    outPath := outDir "\" imgName ".jpg"
    ; Hapus file jika sudah ada
    if FileExist(outPath)
        FileDelete outPath
    ; Simpan gambar
    if (SubStr(outPath, -3) = ".jpg" || SubStr(outPath, -4) = ".jpeg") {
        Gdip_SaveBitmapToFile(pBitmap, outPath, 100)
    } else {
        Gdip_SaveBitmapToFile(pBitmap, outPath)
    }
    Gdip_DisposeImage(pBitmap)
    Gdip_Shutdown(pToken)
    return outPath
}

; @function ComObjectToMap
; @description Rekursif mengubah objek COM menjadi struktur Map.
; @param obj {Object} Objek COM.
; @returns {Map} Struktur data hasil konversi.
ComObjectToMap(obj) {
    result := Map()
    for key in obj {
        try {
            val := obj[key]
            if ComObjType(val) {
                result[key] := ComObjectToMap(val)
            } else {
                result[key] := val
            }
        } catch {
            ; Jika tidak bisa dibaca, skip field itu atau set ke null
            result[key] := ""
        }
    }
    return result
}

; @function SaveJsonToDisk
; @description Simpan konfigurasi ke file JSON.
; @param dataArray {Map|Object} Data konfigurasi.
; @param fileName {String} Nama file.
SaveJsonToDisk(dataArray, fileName) {
    global configSys  ; gunakan nilai global

    if !(Type(dataArray) ~= "Map|Object") {
        MsgBox "Gagal: Tipe data tidak bisa disimpan (bukan Map/Object). Tipe: " Type(dataArray)
        return
    }

    ; Update nilai-nilai configSys dengan nilai dari dataArray
    for key, value in dataArray {
        configSys[key] := value  ; override hanya key yang ada di dataArray
    }

    jsonStr := JSON.stringify(configSys, true)  ; true = pretty print
    manifestPath := A_ScriptDir "\" fileName

    try FileDelete manifestPath
    FileAppend jsonStr, manifestPath, "UTF-8"


    TrayTip "Sukses", fileName " berhasil disimpan!", 2
}

; @function encodeURIComponent
; @description Encode string menjadi URI-safe format.
; @param str {String} String mentah.
; @returns {String} String encoded.
encodeURIComponent(str) {
    static chars := Map()
    if (chars.Count = 0) {
        chars["%"] := "%25", chars[" "] := "%20", chars["!"] := "%21"
        chars["" ""] := "%22", chars["#"] := "%23", chars["$"] := "%24"
        chars["&"] := "%26", chars["'"] := "%27", chars["("] := "%28"
        chars[")"] := "%29", chars["*"] := "%2A", chars["+"] := "%2B"
        chars[","] := "%2C", chars["\"] := "%2F"
        chars[";"] := "%3B", chars["="] := "%3D", chars["?"] := "%3F"
        chars["@"] := "%40", chars["["] := "%5B", chars["]"] := "%5D"
    }

    result := ""
    Loop Parse, str
        result .= chars.Has(A_LoopField) ? chars[A_LoopField] : A_LoopField
    return result
}

; @function FileToBase64
; @description Konversi file menjadi string Base64.
; @param filePath {String} Path ke file.
; @returns {String} String Base64 hasil encode.
FileToBase64(filePath) {
    try {
        stream := ComObject("ADODB.Stream")
        stream.Type := 1  ; binary
        stream.Open()
        stream.LoadFromFile(filePath)
        binaryData := stream.Read()
        stream.Close()

        base64Stream := ComObject("ADODB.Stream")
        base64Stream.Type := 2  ; text
        base64Stream.CharSet := "utf-8"
        base64Stream.Open()

        xml := ComObject("MSXML2.DOMDocument.6.0")
        element := xml.createElement("base64")
        element.dataType := "bin.base64"
        element.nodeTypedValue := binaryData
        base64Stream.WriteText(element.text)
        base64Stream.Position := 0
        return base64Stream.ReadText()
    } catch as e {
        MsgBox "Gagal konversi ke Base64: " e.Message
        return ""
    }
}

LoadJson(filePath) {
    if !FileExist(filePath)
        throw Error("JSON file not found: " filePath)

    jsonText := FileRead(filePath, "UTF-8")
    return JSON.Parse(jsonText)
}

;///////////////////////////////////////////////////////////////////////////////////////////

;Resources for Compiled Scripts
;///////////////////////////////////////////////////////////////////////////////////////////
;@Ahk2Exe-AddResource Lib\32bit\WebView2Loader.dll, 32bit\WebView2Loader.dll
;@Ahk2Exe-AddResource Lib\64bit\WebView2Loader.dll, 64bit\WebView2Loader.dll
;@Ahk2Exe-AddResource index.html, index.html
;@Ahk2Exe-AddResource style.css, style.css
;@Ahk2Exe-AddResource index.js, index.js
;@Ahk2Exe-AddResource config.json, config.json
;///////////////////////////////////////////////////////////////////////////////////////////
