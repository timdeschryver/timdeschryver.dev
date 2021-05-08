<script>
	import { onMount, onDestroy } from 'svelte';
	let bmc;
	onMount(() => {
		bmc = document.querySelector('#bmc-wbtn');
		// content of the script
		// needs to be here because it seems to not play nicely with domcontentloaded
		if (!bmc) {
			!(function (e) {
				var t = {};
				function n(o) {
					if (t[o]) return t[o].exports;
					var a = (t[o] = { i: o, l: !1, exports: {} });
					return e[o].call(a.exports, a, a.exports, n), (a.l = !0), a.exports;
				}
				(n.m = e),
					(n.c = t),
					(n.d = function (e, t, o) {
						n.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: o });
					}),
					(n.r = function (e) {
						'undefined' != typeof Symbol &&
							Symbol.toStringTag &&
							Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
							Object.defineProperty(e, '__esModule', { value: !0 });
					}),
					(n.t = function (e, t) {
						if ((1 & t && (e = n(e)), 8 & t)) return e;
						if (4 & t && 'object' == typeof e && e && e.__esModule) return e;
						var o = Object.create(null);
						if (
							(n.r(o),
							Object.defineProperty(o, 'default', { enumerable: !0, value: e }),
							2 & t && 'string' != typeof e)
						)
							for (var a in e)
								n.d(
									o,
									a,
									function (t) {
										return e[t];
									}.bind(null, a)
								);
						return o;
					}),
					(n.n = function (e) {
						var t =
							e && e.__esModule
								? function () {
										return e.default;
								  }
								: function () {
										return e;
								  };
						return n.d(t, 'a', t), t;
					}),
					(n.o = function (e, t) {
						return Object.prototype.hasOwnProperty.call(e, t);
					}),
					(n.p = ''),
					n((n.s = 0));
			})([
				function (e, t, n) {
					var o = document.querySelector('script[data-name="BMC-Widget"]');
					new FontFace(
						'Avenir Book1',
						'url(https://bmc-cdn.nyc3.digitaloceanspaces.com/Fonts/710789a0-1557-48a1-8cec-03d52d663d74.eot)'
					),
						new FontFace(
							'Avenir Book2',
							'url(https://bmc-cdn.nyc3.digitaloceanspaces.com/Fonts/710789a0-1557-48a1-8cec-03d52d663d74.eot)'
						),
						new FontFace(
							'Avenir Book3',
							'url(https://bmc-cdn.nyc3.digitaloceanspaces.com/Fonts/710789a0-1557-48a1-8cec-03d52d663d74.eot)'
						),
						new FontFace(
							'Avenir Book4',
							'url(https://bmc-cdn.nyc3.digitaloceanspaces.com/Fonts/65d75eb0-2601-4da5-a9a4-9ee67a470a59.woff)'
						),
						new FontFace(
							'Avenir Book5',
							'url(https://bmc-cdn.nyc3.digitaloceanspaces.com/Fonts/65d75eb0-2601-4da5-a9a4-9ee67a470a59.woff)'
						);
					new FontFace(
						'Avenir Book6',
						'url(https://bmc-cdn.nyc3.digitaloceanspaces.com/Fonts/65d75eb0-2601-4da5-a9a4-9ee67a470a59.woff)'
					)
						.load()
						.then(function (e) {
							document.fonts.add(e);
						})
						.catch(function (e) {});
					var e = document.createElement('div');
					(e.id = 'bmc-wbtn'),
						(e.style.display = 'flex'),
						(e.style.alignItems = 'center'),
						(e.style.justifyContent = 'center'),
						(e.style.width = '64px'),
						(e.style.height = '64px'),
						(e.style.background = o.dataset.color),
						(e.style.color = 'white'),
						(e.style.borderRadius = '32px'),
						(e.style.position = 'fixed'),
						'left' == o.dataset.position
							? (e.style.left = o.dataset.x_margin + 'px')
							: (e.style.right = o.dataset.x_margin + 'px'),
						(e.style.bottom = o.dataset.y_margin + 'px'),
						(e.style.boxShadow = '0 4px 8px rgba(0,0,0,.4)'),
						(e.innerHTML =
							'<img src="https://cdn.buymeacoffee.com/widget/assets/coffee%20cup.svg" alt="Buy Me A Coffee" style="height: 40px; width: 40px; margin: 0; padding: 0;">'),
						(e.style.zIndex = '9999'),
						(e.style.cursor = 'pointer'),
						(e.style.fontWeight = '600'),
						(e.style.transition = 'all .2s ease');
					var t = document.createElement('div');
					(t.style.position = 'fixed'),
						(t.style.top = '0'),
						(t.style.left = '0'),
						(t.style.width = '0'),
						(t.style.height = '0'),
						(t.style.background = 'rgba(0, 0, 0, 0)'),
						(t.style.textAlign = 'center'),
						(t.style.zIndex = '99999'),
						(t.style.transition = 'all .4s ease');
					var n = document.createElement('iframe');
					(n.style.position = 'fixed'),
						(n.style.margin = '0'),
						(n.style.border = '0'),
						'left' == o.dataset.position
							? (n.style.left = o.dataset.x_margin + 'px')
							: (n.style.right = o.dataset.x_margin + 'px'),
						(n.style.bottom = parseInt(o.dataset.y_margin, 10) + 80 + 'px'),
						(n.style.height = '0'),
						(n.style.opacity = '0'),
						(n.style.width = 'calc(100vw - 38px)'),
						(n.style.maxWidth = '320px'),
						(n.style.borderRadius = '10px'),
						(n.style.boxShadow = '0 8px 16px rgba(0,0,0,.4)'),
						(n.style.background = '#fff'),
						(n.style.backgroundImage =
							'url(https://cdn.buymeacoffee.com/assets/img/widget/loader.svg)'),
						(n.style.backgroundPosition = 'center'),
						(n.style.backgroundSize = '64px'),
						(n.style.backgroundRepeat = 'no-repeat'),
						(n.style.zIndex = '999999'),
						(n.style.transition = 'all .4s ease'),
						(n.style.maxHeight = '620px');
					var a = document.createElement('div');
					(a.style.position = 'fixed'),
						(a.style.display = 'none'),
						(a.style.opacity = '0'),
						'left' == o.dataset.position
							? (a.style.left = parseInt(o.dataset.x_margin, 10) + 84 + 'px')
							: (a.style.right = parseInt(o.dataset.x_margin, 10) + 84 + 'px'),
						(a.style.bottom = parseInt(o.dataset.y_margin, 10) - 2 + 'px'),
						(a.style.background = '#ffffff'),
						(a.style.zIndex = '9999'),
						(a.style.transition = 'all .4s ease'),
						(a.innerText = o.dataset.message),
						(a.style.boxShadow = '0 4px 8px rgba(0,0,0,.3)'),
						(a.style.padding = '16px'),
						(a.style.borderRadius = '4px'),
						(a.style.fontSize = '14px'),
						(a.style.color = '#000000'),
						(a.style.width = 'auto'),
						(a.style.maxWidth = '260px'),
						(a.style.lineHeight = '1.5'),
						(a.style.fontFamily =
							'"Avenir Book1", "Avenir Book2", "Avenir Book3", "Avenir Book4", "Avenir Book5", "Avenir Book6", sans-serif'),
						(a.style.display = 'none'),
						document.body.appendChild(t),
						t.appendChild(n),
						document.body.appendChild(e),
						document.body.appendChild(a);
					var s = 0;
					(e.onclick = function () {
						s ||
							(n.src =
								'https://www.buymeacoffee.com/widget/page/' +
								o.dataset.id +
								'?description=' +
								encodeURIComponent(o.dataset.description) +
								'&color=' +
								encodeURIComponent(o.dataset.color)),
							s++,
							(a.style.opacity = '0'),
							(a.style.display = 'none'),
							(t.style.width = '100%'),
							(t.style.height = '100%'),
							(n.style.height = 'calc(100% - 140px)'),
							(n.style.opacity = '1'),
							(e.style.transform = 'scale(.8)'),
							(e.innerHTML =
								'<svg focusable="false" aria-hidden="true" width="14" height="14"><path fill="#ffffff" d="M13.978 12.637l-1.341 1.341L6.989 8.33l-5.648 5.648L0 12.637l5.648-5.648L0 1.341 1.341 0l5.648 5.648L12.637 0l1.341 1.341L8.33 6.989l5.648 5.648z" fill-rule="evenodd"></path></svg>');
					}),
						(e.onmouseover = function () {
							o.dataset.message &&
								'' != o.dataset.message &&
								((a.style.display = 'block'), (a.style.opacity = '1'));
						}),
						(e.onmouseleave = function () {
							setTimeout(function () {
								(a.style.display = 'none'), (a.style.opacity = '0');
							}, 2e3);
						}),
						(t.onclick = function () {
							(t.style.width = '0'),
								(t.style.height = '0'),
								(n.style.height = '0'),
								(n.style.opacity = '0'),
								(e.style.transform = 'scale(1)'),
								(e.innerHTML =
									'<img src="https://cdn.buymeacoffee.com/widget/assets/coffee%20cup.svg" alt="Buy Me A Coffee" style="height: 40px; width: 40px; margin: 0; padding: 0;">');
						});
				}
			]);
		}

		bmc = document.querySelector('#bmc-wbtn');
		bmc.style.display = 'none';
	});

	let y;
	$: if (bmc && y > 1000) {
		bmc.style.display = 'flex';
	}

	onDestroy(() => {
		if (bmc) {
			bmc.style.display = 'none';
		}
	});
</script>

<svelte:head>
	<script
		data-name="BMC-Widget"
		src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
		defer="true"
		data-id="timdeschryver"
		data-description="Support me on Buy me a coffee!"
		data-message="If you liked my blog, consider buying my a coffee!"
		data-color="#FF813F"
		data-position="left"
		data-x_margin="18"
		data-y_margin="18">
	</script>
</svelte:head>

<svelte:window bind:scrollY={y} />

<p>Please consider supporting me if have you enjoyed this post and found it useful:</p>
<div>
	<a
		class="support"
		href="https://www.buymeacoffee.com/timdeschryver"
		target="_blank"
		rel="nofollow noreferrer"
	>
		<img
			src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
			alt="Buy Me A Coffee"
			style="width: 217px !important;"
		/>
	</a>
	<a
		class="support"
		target="_blank"
		rel="nofollow noreferrer"
		href="https://www.paypal.com/donate?hosted_button_id=59M5TFPQJS8SQ"
	>
		<img
			src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAxcHgiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAxMDEgMzIiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHhtbG5zPSJodHRwOiYjeDJGOyYjeDJGO3d3dy53My5vcmcmI3gyRjsyMDAwJiN4MkY7c3ZnIj48cGF0aCBmaWxsPSIjMDAzMDg3IiBkPSJNIDEyLjIzNyAyLjggTCA0LjQzNyAyLjggQyAzLjkzNyAyLjggMy40MzcgMy4yIDMuMzM3IDMuNyBMIDAuMjM3IDIzLjcgQyAwLjEzNyAyNC4xIDAuNDM3IDI0LjQgMC44MzcgMjQuNCBMIDQuNTM3IDI0LjQgQyA1LjAzNyAyNC40IDUuNTM3IDI0IDUuNjM3IDIzLjUgTCA2LjQzNyAxOC4xIEMgNi41MzcgMTcuNiA2LjkzNyAxNy4yIDcuNTM3IDE3LjIgTCAxMC4wMzcgMTcuMiBDIDE1LjEzNyAxNy4yIDE4LjEzNyAxNC43IDE4LjkzNyA5LjggQyAxOS4yMzcgNy43IDE4LjkzNyA2IDE3LjkzNyA0LjggQyAxNi44MzcgMy41IDE0LjgzNyAyLjggMTIuMjM3IDIuOCBaIE0gMTMuMTM3IDEwLjEgQyAxMi43MzcgMTIuOSAxMC41MzcgMTIuOSA4LjUzNyAxMi45IEwgNy4zMzcgMTIuOSBMIDguMTM3IDcuNyBDIDguMTM3IDcuNCA4LjQzNyA3LjIgOC43MzcgNy4yIEwgOS4yMzcgNy4yIEMgMTAuNjM3IDcuMiAxMS45MzcgNy4yIDEyLjYzNyA4IEMgMTMuMTM3IDguNCAxMy4zMzcgOS4xIDEzLjEzNyAxMC4xIFoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMDAzMDg3IiBkPSJNIDM1LjQzNyAxMCBMIDMxLjczNyAxMCBDIDMxLjQzNyAxMCAzMS4xMzcgMTAuMiAzMS4xMzcgMTAuNSBMIDMwLjkzNyAxMS41IEwgMzAuNjM3IDExLjEgQyAyOS44MzcgOS45IDI4LjAzNyA5LjUgMjYuMjM3IDkuNSBDIDIyLjEzNyA5LjUgMTguNjM3IDEyLjYgMTcuOTM3IDE3IEMgMTcuNTM3IDE5LjIgMTguMDM3IDIxLjMgMTkuMzM3IDIyLjcgQyAyMC40MzcgMjQgMjIuMTM3IDI0LjYgMjQuMDM3IDI0LjYgQyAyNy4zMzcgMjQuNiAyOS4yMzcgMjIuNSAyOS4yMzcgMjIuNSBMIDI5LjAzNyAyMy41IEMgMjguOTM3IDIzLjkgMjkuMjM3IDI0LjMgMjkuNjM3IDI0LjMgTCAzMy4wMzcgMjQuMyBDIDMzLjUzNyAyNC4zIDM0LjAzNyAyMy45IDM0LjEzNyAyMy40IEwgMzYuMTM3IDEwLjYgQyAzNi4yMzcgMTAuNCAzNS44MzcgMTAgMzUuNDM3IDEwIFogTSAzMC4zMzcgMTcuMiBDIDI5LjkzNyAxOS4zIDI4LjMzNyAyMC44IDI2LjEzNyAyMC44IEMgMjUuMDM3IDIwLjggMjQuMjM3IDIwLjUgMjMuNjM3IDE5LjggQyAyMy4wMzcgMTkuMSAyMi44MzcgMTguMiAyMy4wMzcgMTcuMiBDIDIzLjMzNyAxNS4xIDI1LjEzNyAxMy42IDI3LjIzNyAxMy42IEMgMjguMzM3IDEzLjYgMjkuMTM3IDE0IDI5LjczNyAxNC42IEMgMzAuMjM3IDE1LjMgMzAuNDM3IDE2LjIgMzAuMzM3IDE3LjIgWiI+PC9wYXRoPjxwYXRoIGZpbGw9IiMwMDMwODciIGQ9Ik0gNTUuMzM3IDEwIEwgNTEuNjM3IDEwIEMgNTEuMjM3IDEwIDUwLjkzNyAxMC4yIDUwLjczNyAxMC41IEwgNDUuNTM3IDE4LjEgTCA0My4zMzcgMTAuOCBDIDQzLjIzNyAxMC4zIDQyLjczNyAxMCA0Mi4zMzcgMTAgTCAzOC42MzcgMTAgQyAzOC4yMzcgMTAgMzcuODM3IDEwLjQgMzguMDM3IDEwLjkgTCA0Mi4xMzcgMjMgTCAzOC4yMzcgMjguNCBDIDM3LjkzNyAyOC44IDM4LjIzNyAyOS40IDM4LjczNyAyOS40IEwgNDIuNDM3IDI5LjQgQyA0Mi44MzcgMjkuNCA0My4xMzcgMjkuMiA0My4zMzcgMjguOSBMIDU1LjgzNyAxMC45IEMgNTYuMTM3IDEwLjYgNTUuODM3IDEwIDU1LjMzNyAxMCBaIj48L3BhdGg+PHBhdGggZmlsbD0iIzAwOWNkZSIgZD0iTSA2Ny43MzcgMi44IEwgNTkuOTM3IDIuOCBDIDU5LjQzNyAyLjggNTguOTM3IDMuMiA1OC44MzcgMy43IEwgNTUuNzM3IDIzLjYgQyA1NS42MzcgMjQgNTUuOTM3IDI0LjMgNTYuMzM3IDI0LjMgTCA2MC4zMzcgMjQuMyBDIDYwLjczNyAyNC4zIDYxLjAzNyAyNCA2MS4wMzcgMjMuNyBMIDYxLjkzNyAxOCBDIDYyLjAzNyAxNy41IDYyLjQzNyAxNy4xIDYzLjAzNyAxNy4xIEwgNjUuNTM3IDE3LjEgQyA3MC42MzcgMTcuMSA3My42MzcgMTQuNiA3NC40MzcgOS43IEMgNzQuNzM3IDcuNiA3NC40MzcgNS45IDczLjQzNyA0LjcgQyA3Mi4yMzcgMy41IDcwLjMzNyAyLjggNjcuNzM3IDIuOCBaIE0gNjguNjM3IDEwLjEgQyA2OC4yMzcgMTIuOSA2Ni4wMzcgMTIuOSA2NC4wMzcgMTIuOSBMIDYyLjgzNyAxMi45IEwgNjMuNjM3IDcuNyBDIDYzLjYzNyA3LjQgNjMuOTM3IDcuMiA2NC4yMzcgNy4yIEwgNjQuNzM3IDcuMiBDIDY2LjEzNyA3LjIgNjcuNDM3IDcuMiA2OC4xMzcgOCBDIDY4LjYzNyA4LjQgNjguNzM3IDkuMSA2OC42MzcgMTAuMSBaIj48L3BhdGg+PHBhdGggZmlsbD0iIzAwOWNkZSIgZD0iTSA5MC45MzcgMTAgTCA4Ny4yMzcgMTAgQyA4Ni45MzcgMTAgODYuNjM3IDEwLjIgODYuNjM3IDEwLjUgTCA4Ni40MzcgMTEuNSBMIDg2LjEzNyAxMS4xIEMgODUuMzM3IDkuOSA4My41MzcgOS41IDgxLjczNyA5LjUgQyA3Ny42MzcgOS41IDc0LjEzNyAxMi42IDczLjQzNyAxNyBDIDczLjAzNyAxOS4yIDczLjUzNyAyMS4zIDc0LjgzNyAyMi43IEMgNzUuOTM3IDI0IDc3LjYzNyAyNC42IDc5LjUzNyAyNC42IEMgODIuODM3IDI0LjYgODQuNzM3IDIyLjUgODQuNzM3IDIyLjUgTCA4NC41MzcgMjMuNSBDIDg0LjQzNyAyMy45IDg0LjczNyAyNC4zIDg1LjEzNyAyNC4zIEwgODguNTM3IDI0LjMgQyA4OS4wMzcgMjQuMyA4OS41MzcgMjMuOSA4OS42MzcgMjMuNCBMIDkxLjYzNyAxMC42IEMgOTEuNjM3IDEwLjQgOTEuMzM3IDEwIDkwLjkzNyAxMCBaIE0gODUuNzM3IDE3LjIgQyA4NS4zMzcgMTkuMyA4My43MzcgMjAuOCA4MS41MzcgMjAuOCBDIDgwLjQzNyAyMC44IDc5LjYzNyAyMC41IDc5LjAzNyAxOS44IEMgNzguNDM3IDE5LjEgNzguMjM3IDE4LjIgNzguNDM3IDE3LjIgQyA3OC43MzcgMTUuMSA4MC41MzcgMTMuNiA4Mi42MzcgMTMuNiBDIDgzLjczNyAxMy42IDg0LjUzNyAxNCA4NS4xMzcgMTQuNiBDIDg1LjczNyAxNS4zIDg1LjkzNyAxNi4yIDg1LjczNyAxNy4yIFoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMDA5Y2RlIiBkPSJNIDk1LjMzNyAzLjMgTCA5Mi4xMzcgMjMuNiBDIDkyLjAzNyAyNCA5Mi4zMzcgMjQuMyA5Mi43MzcgMjQuMyBMIDk1LjkzNyAyNC4zIEMgOTYuNDM3IDI0LjMgOTYuOTM3IDIzLjkgOTcuMDM3IDIzLjQgTCAxMDAuMjM3IDMuNSBDIDEwMC4zMzcgMy4xIDEwMC4wMzcgMi44IDk5LjYzNyAyLjggTCA5Ni4wMzcgMi44IEMgOTUuNjM3IDIuOCA5NS40MzcgMyA5NS4zMzcgMy4zIFoiPjwvcGF0aD48L3N2Zz4="
			alt="PayPal logo"
			aria-label="Support the blog"
			width="300"
		/>
	</a>
</div>

<style>
	img {
		height: 55px;
	}
	div {
		margin-top: 0;
	}
	a {
		display: inline-block;
		vertical-align: middle;
		margin-right: 1em;
	}
</style>
