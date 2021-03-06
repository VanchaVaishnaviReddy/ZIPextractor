(function(e) {
    function m() {
        var e = -1,
            t = this;
        t.append = function(n) {
            var r, i = t.table;
            for (r = 0; r < n.length; r++) e = e >>> 8 ^ i[(e ^ n[r]) & 255]
        };
        t.get = function() {
            return ~e
        }
    }

    function g(e, t, n) {
        if (e.slice) return e.slice(t, t + n);
        else if (e.webkitSlice) return e.webkitSlice(t, t + n);
        else if (e.mozSlice) return e.mozSlice(t, t + n);
        else if (e.msSlice) return e.msSlice(t, t + n)
    }

    function y(e, t) {
        var n, r;
        n = new ArrayBuffer(e);
        r = new Uint8Array(n);
        if (t) r.set(t, 0);
        return {
            buffer: n,
            array: r,
            view: new DataView(n)
        }
    }

    function b() {}

    function w(e) {
        function r(r, i) {
            var s = new Blob([e], {
                type: h
            });
            n = new S(s);
            n.init(function() {
                t.size = n.size;
                r()
            }, i)
        }

        function i(e, t, r, i) {
            n.readUint8Array(e, t, r, i)
        }
        var t = this,
            n;
        t.size = 0;
        t.init = r;
        t.readUint8Array = i
    }

    function E(t) {
        function i(e) {
            var i = t.length;
            while (t.charAt(i - 1) == "=") i--;
            r = t.indexOf(",") + 1;
            n.size = Math.floor((i - r) * .75);
            e()
        }

        function s(n, i, s) {
            var o, u = y(i);
            var a = Math.floor(n / 3) * 4;
            var f = Math.ceil((n + i) / 3) * 4;
            var l = e.atob(t.substring(a + r, f + r));
            var c = n - Math.floor(a / 4) * 3;
            for (o = c; o < c + i; o++) u.array[o - c] = l.charCodeAt(o);
            s(u.array)
        }
        var n = this,
            r;
        n.size = 0;
        n.init = i;
        n.readUint8Array = s
    }

    function S(e) {
        function n(t) {
            this.size = e.size;
            t()
        }

        function r(t, n, r, i) {
            var s = new FileReader;
            s.onload = function(e) {
                r(new Uint8Array(e.target.result))
            };
            s.onerror = i;
            s.readAsArrayBuffer(g(e, t, n))
        }
        var t = this;
        t.size = 0;
        t.init = n;
        t.readUint8Array = r
    }

    function x() {}

    function T(e) {
        function r(e) {
            n = new Blob([], {
                type: h
            });
            e()
        }

        function i(e, t) {
            n = new Blob([n, d ? e : e.buffer], {
                type: h
            });
            t()
        }

        function s(t, r) {
            var i = new FileReader;
            i.onload = function(e) {
                t(e.target.result)
            };
            i.onerror = r;
            i.readAsText(n, e)
        }
        var t = this,
            n;
        t.init = r;
        t.writeUint8Array = i;
        t.getData = s
    }

    function N(t) {
        function s(e) {
            r += "data:" + (t || "") + ";base64,";
            e()
        }

        function o(t, n) {
            var s, o = i.length,
                u = i;
            i = "";
            for (s = 0; s < Math.floor((o + t.length) / 3) * 3 - o; s++) u += String.fromCharCode(t[s]);
            for (; s < t.length; s++) i += String.fromCharCode(t[s]);
            if (u.length > 2) r += e.btoa(u);
            else i = u;
            n()
        }

        function u(t) {
            t(r + e.btoa(i))
        }
        var n = this,
            r = "",
            i = "";
        n.init = s;
        n.writeUint8Array = o;
        n.getData = u
    }

    function C(e) {
        function r(n) {
            t = new Blob([], {
                type: e
            });
            n()
        }

        function i(n, r) {
            t = new Blob([t, d ? n : n.buffer], {
                type: e
            });
            r()
        }

        function s(e) {
            e(t)
        }
        var t, n = this;
        n.init = r;
        n.writeUint8Array = i;
        n.getData = s
    }

    function k(e, t, n, r, i, s, o, u, a, l) {
        function v() {
            e.removeEventListener(p, m, false);
            u(d)
        }

        function m(e) {
            var t = e.data,
                r = t.data;
            if (t.onappend) {
                d += r.length;
                n.writeUint8Array(r, function() {
                    s(false, r);
                    g()
                }, l)
            }
            if (t.onflush)
                if (r) {
                    d += r.length;
                    n.writeUint8Array(r, function() {
                        s(false, r);
                        v()
                    }, l)
                } else v();
            if (t.progress && o) o(h + t.current, i)
        }

        function g() {
            h = c * f;
            if (h < i) t.readUint8Array(r + h, Math.min(f, i - h), function(t) {
                e.postMessage({
                    append: true,
                    data: t
                });
                c++;
                if (o) o(h, i);
                s(true, t)
            }, a);
            else e.postMessage({
                flush: true
            })
        }
        var c = 0,
            h, d;
        d = 0;
        e.addEventListener(p, m, false);
        g()
    }

    function L(e, t, n, r, i, s, o, u, a, l) {
        function d() {
            var v;
            h = c * f;
            if (h < i) t.readUint8Array(r + h, Math.min(f, i - h), function(t) {
                var u = e.append(t, function() {
                    if (o) o(r + h, i)
                });
                p += u.length;
                s(true, t);
                n.writeUint8Array(u, function() {
                    s(false, u);
                    c++;
                    setTimeout(d, 1)
                }, l);
                if (o) o(h, i)
            }, a);
            else {
                v = e.flush();
                if (v) {
                    p += v.length;
                    n.writeUint8Array(v, function() {
                        s(false, v);
                        u(p)
                    }, l)
                } else u(p)
            }
        }
        var c = 0,
            h, p = 0;
        d()
    }

    function A(t, n, r, i, s, o, u, a, f) {
        function p(e, t) {
            if (s && !e) h.append(t)
        }

        function d(e) {
            o(e, h.get())
        }
        var c, h = new m;
        if (e.zip.useWebWorkers) {
            c = new Worker(e.zip.workerScriptsPath + l);
            k(c, t, n, r, i, p, u, d, a, f)
        } else L(new e.zip.Inflater, t, n, r, i, p, u, d, a, f);
        return c
    }

    function O(t, n, r, i, s, o, u) {
        function l(e, t) {
            if (e) f.append(t)
        }

        function h(e) {
            i(e, f.get())
        }

        function d() {
            a.removeEventListener(p, d, false);
            k(a, t, n, 0, t.size, l, s, h, o, u)
        }
        var a, f = new m;
        if (e.zip.useWebWorkers) {
            a = new Worker(e.zip.workerScriptsPath + c);
            a.addEventListener(p, d, false);
            a.postMessage({
                init: true,
                level: r
            })
        } else L(new e.zip.Deflater, t, n, 0, t.size, l, s, h, o, u);
        return a
    }

    function M(e, t, n, r, i, s, o, u, a) {
        function h() {
            var p = l * f;
            if (p < r) e.readUint8Array(n + p, Math.min(f, r - p), function(e) {
                if (i) c.append(e);
                if (o) o(p, r, e);
                t.writeUint8Array(e, function() {
                    l++;
                    h()
                }, a)
            }, u);
            else s(r, c.get())
        }
        var l = 0,
            c = new m;
        h()
    }

    function _(e) {
        var t, n = "",
            r, i = ["??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "_", "_", "_", "??", "??", "??", "??", "??", "??", "??", "??", "+", "+", "??", "??", "+", "+", "-", "-", "+", "-", "+", "??", "??", "+", "+", "-", "-", "??", "-", "+", "??", "??", "??", "??", "??", "??", "i", "??", "??", "??", "+", "+", "_", "_", "??", "??", "_", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "_", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "_", " "];
        for (t = 0; t < e.length; t++) {
            r = e.charCodeAt(t) & 255;
            if (r > 127) n += i[r - 128];
            else n += String.fromCharCode(r)
        }
        return n
    }

    function D(e) {
        return decodeURIComponent(escape(e))
    }

    function P(e) {
        var t, n = "";
        for (t = 0; t < e.length; t++) n += String.fromCharCode(e[t]);
        return n
    }

    function H(e) {
        var t = (e & 4294901760) >> 16,
            n = e & 65535;
        try {
            return new Date(1980 + ((t & 65024) >> 9), ((t & 480) >> 5) - 1, t & 31, (n & 63488) >> 11, (n & 2016) >> 5, (n & 31) * 2, 0)
        } catch (r) {}
    }

    function B(e, t, i, s, o) {
        e.version = t.view.getUint16(i, true);
        e.bitFlag = t.view.getUint16(i + 2, true);
        e.compressionMethod = t.view.getUint16(i + 4, true);
        e.lastModDateRaw = t.view.getUint32(i + 6, true);
        e.lastModDate = H(e.lastModDateRaw);
        if ((e.bitFlag & 1) === 1) {
            o(n);
            return
        }
        if (s || (e.bitFlag & 8) != 8) {
            e.crc32 = t.view.getUint32(i + 10, true);
            e.compressedSize = t.view.getUint32(i + 14, true);
            e.uncompressedSize = t.view.getUint32(i + 18, true)
        }
        if (e.compressedSize === 4294967295 || e.uncompressedSize === 4294967295) {
            o(r);
            return
        }
        e.filenameLength = t.view.getUint16(i + 22, true);
        e.extraFieldLength = t.view.getUint16(i + 24, true)
    }

    function j(e, n) {
        function r() {}

        function s(r, o) {
            if (e.size <= r) {
                n(t);
                return
            }
            e.readUint8Array(e.size - r, r, function(e) {
                var t = y(e.length, e).view;
                if (t.getUint32(0) != 1347093766) {
                    s(r + 1, o)
                } else {
                    o(t)
                }
            }, function() {
                n(i)
            })
        }
        r.prototype.getData = function(r, i, s, a) {
            function c(e, t) {
                if (l) l.terminate();
                l = null;
                if (e) e(t)
            }

            function h(e) {
                var t = y(4);
                t.view.setUint32(0, e);
                return f.crc32 == t.view.getUint32(0)
            }

            function p(e, t) {
                if (a && !h(t)) d();
                else r.getData(function(e) {
                    c(i, e)
                })
            }

            function d() {
                c(n, u)
            }

            function v() {
                c(n, o)
            }
            var f = this,
                l;
            e.readUint8Array(f.offset, 30, function(i) {
                var o = y(i.length, i),
                    u;
                if (o.view.getUint32(0) != 1347093252) {
                    n(t);
                    return
                }
                B(f, o, 4, false, n);
                u = f.offset + 30 + f.filenameLength + f.extraFieldLength;
                r.init(function() {
                    if (f.compressionMethod === 0) M(e, r, u, f.compressedSize, a, p, s, d, v);
                    else l = A(e, r, u, f.compressedSize, a, p, s, d, v)
                }, v)
            }, d)
        };
        return {
            getEntries: function(o) {
                if (e.size < 22) {
                    n(t);
                    return
                }
                s(22, function(s) {
                    var u, a;
                    u = s.getUint32(16, true);
                    a = s.getUint16(8, true);
                    e.readUint8Array(u, e.size - u, function(e) {
                        var i, s = 0,
                            u = [],
                            f, l, c, h = y(e.length, e);
                        for (i = 0; i < a; i++) {
                            f = new r;
                            if (h.view.getUint32(s) != 1347092738) {
                                n(t);
                                return
                            }
                            B(f, h, s + 6, true, n);
                            f.commentLength = h.view.getUint16(s + 32, true);
                            f.directory = (h.view.getUint8(s + 38) & 16) == 16;
                            f.offset = h.view.getUint32(s + 42, true);
                            l = P(h.array.subarray(s + 46, s + 46 + f.filenameLength));
                            f.filename = (f.bitFlag & 2048) === 2048 ? D(l) : _(l);
                            if (!f.directory && f.filename.charAt(f.filename.length - 1) == "/") f.directory = true;
                            c = P(h.array.subarray(s + 46 + f.filenameLength + f.extraFieldLength, s + 46 + f.filenameLength + f.extraFieldLength + f.commentLength));
                            f.comment = (f.bitFlag & 2048) === 2048 ? D(c) : _(c);
                            u.push(f);
                            s += 46 + f.filenameLength + f.extraFieldLength + f.commentLength
                        }
                        o(u)
                    }, function() {
                        n(i)
                    })
                })
            },
            close: function(e) {
                if (e) e()
            }
        }
    }

    function F(e) {
        return unescape(encodeURIComponent(e))
    }

    function I(e) {
        var t, n = [];
        for (t = 0; t < e.length; t++) n.push(e.charCodeAt(t));
        return n
    }

    function q(e, t, n) {
        function l(e, t) {
            if (r) r.terminate();
            r = null;
            if (e) e(t)
        }

        function c() {
            l(t, s)
        }

        function h() {
            l(t, u)
        }
        var r, i = {},
            o = [],
            f = 0;
        return {
            add: function(s, u, p, d, v) {
                function w(t) {
                    var r;
                    b = v.lastModDate || new Date;
                    m = y(26);
                    i[s] = {
                        headerArray: m.array,
                        directory: v.directory,
                        filename: g,
                        offset: f,
                        comment: I(F(v.comment || ""))
                    };
                    m.view.setUint32(0, 335546376);
                    if (v.version) m.view.setUint8(0, v.version);
                    if (!n && v.level !== 0 && !v.directory) m.view.setUint16(4, 2048);
                    m.view.setUint16(6, (b.getHours() << 6 | b.getMinutes()) << 5 | b.getSeconds() / 2, true);
                    m.view.setUint16(8, (b.getFullYear() - 1980 << 4 | b.getMonth() + 1) << 5 | b.getDate(), true);
                    m.view.setUint16(22, g.length, true);
                    r = y(30 + g.length);
                    r.view.setUint32(0, 1347093252);
                    r.array.set(m.array, 4);
                    r.array.set(g, 30);
                    f += r.array.length;
                    e.writeUint8Array(r.array, t, c)
                }

                function E(t, n) {
                    var r = y(16);
                    f += t || 0;
                    r.view.setUint32(0, 1347094280);
                    if (typeof n != "undefined") {
                        m.view.setUint32(10, n, true);
                        r.view.setUint32(4, n, true)
                    }
                    if (u) {
                        r.view.setUint32(8, t, true);
                        m.view.setUint32(14, t, true);
                        r.view.setUint32(12, u.size, true);
                        m.view.setUint32(18, u.size, true)
                    }
                    e.writeUint8Array(r.array, function() {
                        f += 16;
                        l(p)
                    }, c)
                }

                function S() {
                    v = v || {};
                    s = s.trim();
                    if (v.directory && s.charAt(s.length - 1) != "/") s += "/";
                    if (i.hasOwnProperty(s)) {
                        t(a);
                        return
                    }
                    g = I(F(s));
                    o.push(s);
                    w(function() {
                        if (u)
                            if (n || v.level === 0) M(u, e, 0, u.size, true, E, d, h, c);
                            else r = O(u, e, v.level, E, d, h, c);
                        else E()
                    }, c)
                }
                var m, g, b;
                if (u) u.init(S, h);
                else S()
            },
            close: function(t) {
                var n, r = 0,
                    s = 0,
                    u, a;
                for (u = 0; u < o.length; u++) {
                    a = i[o[u]];
                    r += 46 + a.filename.length + a.comment.length
                }
                n = y(r + 22);
                for (u = 0; u < o.length; u++) {
                    a = i[o[u]];
                    n.view.setUint32(s, 1347092738);
                    n.view.setUint16(s + 4, 5120);
                    n.array.set(a.headerArray, s + 6);
                    n.view.setUint16(s + 32, a.comment.length, true);
                    if (a.directory) n.view.setUint8(s + 38, 16);
                    n.view.setUint32(s + 42, a.offset, true);
                    n.array.set(a.filename, s + 46);
                    n.array.set(a.comment, s + 46 + a.filename.length);
                    s += 46 + a.filename.length + a.comment.length
                }
                n.view.setUint32(s, 1347093766);
                n.view.setUint16(s + 8, o.length, true);
                n.view.setUint16(s + 10, o.length, true);
                n.view.setUint32(s + 12, r, true);
                n.view.setUint32(s + 16, f, true);
                e.writeUint8Array(n.array, function() {
                    l(function() {
                        e.getData(t)
                    })
                }, c)
            }
        }
    }
    var t = "Not a ZIP file, or unsupported ZIP format.";
    var n = "Password-encrypted ZIP files are not supported.";
    var r = "File is using Zip64 (4gb+ file size).";
    var i = "Error while reading zip file.";
    var s = "Error while writing zip file.";
    var o = "Error while writing file data.";
    var u = "Error while reading file data.";
    var a = "File already exists.";
    var f = 512 * 1024;
    var l = "inflate.js";
    var c = "deflate.js";
    var h = "text/plain";
    var p = "message";
    var d;
    try {
        d = (new Blob([new DataView(new ArrayBuffer(0))])).size === 0
    } catch (v) {}
    m.prototype.table = function() {
        var e, t, n, r = [];
        for (e = 0; e < 256; e++) {
            n = e;
            for (t = 0; t < 8; t++)
                if (n & 1) n = n >>> 1 ^ 3988292384;
                else n = n >>> 1;
            r[e] = n
        }
        return r
    }();
    w.prototype = new b;
    w.prototype.constructor = w;
    E.prototype = new b;
    E.prototype.constructor = E;
    S.prototype = new b;
    S.prototype.constructor = S;
    x.prototype.getData = function(e) {
        e(this.data)
    };
    T.prototype = new x;
    T.prototype.constructor = T;
    N.prototype = new x;
    N.prototype.constructor = N;
    C.prototype = new x;
    C.prototype.constructor = C;
    e.zip = {
        Reader: b,
        Writer: x,
        BlobReader: S,
        Data64URIReader: E,
        TextReader: w,
        BlobWriter: C,
        Data64URIWriter: N,
        TextWriter: T,
        createReader: function(e, t, n) {
            e.init(function() {
                t(j(e, n))
            }, n)
        },
        createWriter: function(e, t, n, r) {
            e.init(function() {
                t(q(e, n, r))
            }, n)
        },
        workerScriptsPath: "",
        useWebWorkers: true
    }
})(this)