Most of the games data will probably come from mix-matched real data and some simulated data which you have the freedom to do. 

The real data is probably mostly from the papers and datasets codex already used in the simulations dir. 

The one thing i would point out and suggest is, look for whether fires happened _after_ 2017 from burn scars news etc. For example, this is what gpt online says

```
Yes — **the broader Autazes area definitely had fire activity after 2017**, so your idea is viable in principle. For example, Amazonas state reporting lists Autazes among municipalities with heat/fire detections in 2019. ([IPAAM][1])

But I have **not yet verified that a post-2017 burn scar crossed the exact four LiDAR transects used in the 2017/2018 study** (`T_0638`, `T_0639`, `T_1080`, `T_1081`). That exact overlap is the key test.

And conveniently, we now have a very good way to check it: MapBiomas Fogo provides **annual 30 m burned-area rasters from 1985–2025**, derived from Landsat/NBR, plus month-of-burn layers. ([MapBiomas Brasil][2]) The LiDAR paper names the exact transects, so all we'd need to do is spatially intersect those transect polygons with MapBiomas burn rasters for **2018 onward**. ([ScienceDirect][3])

If there is a clean later fire, this is actually better for the game than the 2015 reconstruction:

**2017 LiDAR = genuine pre-fire structural baseline**
→ players inspect canopy gaps / understory / edges / other layers
→ a real fire occurs in, say, 2019/2020/2023
→ hide the burn scar
→ players construct the fuel map
→ run ForeFire from plausible ignition points
→ reveal the actual later MapBiomas/Landsat scar and score them.

That avoids our biggest problem with the 2015 case: trying to reconstruct pre-fire structure from LiDAR collected **after** the fire.

So the next check should be very concrete: intersect the four LiDAR transects against MapBiomas Fogo for **2018–2025**, and see whether any later burn polygon overlaps enough of one transect to make a playable case. If yes, that may be the cleanest real-data Stage 4 setup we've found.

[1]: https://www.ipaam.am.gov.br/amazonas-tem-reducao-de-6-no-numero-de-focos-de-calor-no-primeiro-semestre-de-2019/?utm_source=chatgpt.com "Amazonas tem redução de 6% no número de focos de calor, no primeiro semestre de 2019 - IPAAM - IPAAM"
[2]: https://brasil.mapbiomas.org/iniciativas-e-produtos/fogo/mapeamento-anual/anual/?utm_source=chatgpt.com "Anual – MapBiomas Brasil"
[3]: https://www.sciencedirect.com/science/article/pii/S0378112725008400?utm_source=chatgpt.com "Fire in a Central Amazon forest: Lingering top canopy loss and initial understory regrowth revealed by repeated LiDAR - ScienceDirect"

```

But of course you do have freedom to simulate and try things that make the game realistic tie together what we've learned and interesting at once. 

And regarding invasives data points this is what teh gpt online agent says (again, don't take it literally when the agent says "the story you want" you are in control of this story and the authority
```
Yes — there is **strong Amazon-specific evidence that invasive/exotic grasses can materially increase fire intensity and create a positive fire–invasion feedback**. This is much stronger than merely saying “invasives might matter.”

The cleanest study is from the **southern/southeastern Brazilian Amazon**, where researchers ran an eight-year fire experiment in transitional forest. After repeated burns opened the canopy, native and exotic pasture grasses invaded up to roughly **200 m into burned forest**, while invasion stayed under 10 m in the unburned control. Crucially, grass-dominated edge areas had **more than three times the fine-fuel load**, and fires there were especially intense. One of the exotic grasses was *Brachiaria decumbens*, an African C4 pasture grass. ([PubMed Central (PMC)][1])

So the mechanism is very close to the story you want:

**fire opens canopy → more light reaches ground → grasses invade → grasses create lots of fine, continuous fuel → next fire burns more intensely → more trees die → canopy opens further.**

That is a documented **fire–grass feedback**, not just speculation. ([PubMed Central (PMC)][1])

There is also broader modeling work suggesting this vulnerability is geographically substantial. A 2021 Amazon-wide study combining fire–ecosystem modeling, remote sensing, and empirical relationships estimated that about **14% of the Amazon under current climate** was vulnerable to post-fire grass invasion, with southeastern Amazonia most exposed; it also identified places where fire return intervals were already shorter than canopy recovery times, making persistent grass-dominated degraded states plausible. ([Wiley Online Library][2])

But one distinction matters for **Autazes** specifically: I have not found evidence that the **2015 Autazes fire itself** was demonstrated to have been driven by invasive grasses. The Autazes papers are about drought, understory fire, tree mortality and later LiDAR structure. So for that historical fire, saying “invasives caused/intensified it” would be an unsupported addition.

For Stage 4, though, you now have a very defensible way to adapt the case:

* **Autazes supplies the real rainforest, drought, burn scar, field effects and LiDAR aftermath.**
* **Southeastern Amazon fire experiments supply the real invasive-grass mechanism.**
* Your game can insert a reconstructed grass-invasion layer into the pre-fire landscape and clearly label that layer as a **scenario inspired by measured Amazon fire–grass feedbacks**, rather than claiming it was historically mapped at Autazes.

That is probably better than using a fake “Amazon lantana.” You could use something like **African pasture grass/Brachiaria-type invasion at fragmented forest edges**, which is actually documented in Amazon fire ecology. ([PubMed Central (PMC)][1])

And visually it works perfectly with the LiDAR idea: the invasive signature would not necessarily be a 2–3 m lantana thicket; it could be **canopy opening + unusually dense near-ground grass/fine-fuel layer**, especially along edges. That's still something LiDAR-derived vertical profiles plus hyperspectral/spectral classification could plausibly help detect.

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC3638439/?utm_source=chatgpt.com "Testing the Amazon savannization hypothesis: fire effects on invasion of a neotropical forest by native cerrado and exotic pasture grasses - PMC"
[2]: https://onlinelibrary.wiley.com/doi/10.1111/geb.13388?utm_source=chatgpt.com "Climate change and deforestation increase the vulnerability of Amazonian forests to post‐fire grass invasion - De Faria - 2021 - Global Ecology and Biogeography - Wiley Online Library"
```
