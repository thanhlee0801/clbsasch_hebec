package com.example.hebec_books

import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {
    private lateinit var shopWebView: WebView

    @Suppress("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        shopWebView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.allowFileAccessFromFileURLs = false
            settings.allowUniversalAccessFromFileURLs = false
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
        }
        setContentView(shopWebView)
        shopWebView.loadUrl("file:///android_asset/site/index.html")
    }

    @Deprecated("Deprecated in Android, retained for compatibility with the packaged WebView")
    override fun onBackPressed() {
        if (::shopWebView.isInitialized && shopWebView.canGoBack()) shopWebView.goBack()
        else super.onBackPressed()
    }

    override fun onDestroy() {
        if (::shopWebView.isInitialized) shopWebView.destroy()
        super.onDestroy()
    }
}
