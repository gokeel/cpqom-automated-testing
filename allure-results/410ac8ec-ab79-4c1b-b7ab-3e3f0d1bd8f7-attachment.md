# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: non-ida/account-mgmt.spec.js >> Account Management
- Location: tests/non-ida/account-mgmt.spec.js:7:6

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div').filter({ hasText: 'It looks as if duplicates exist for this Account' }).nth(3)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('div').filter({ hasText: 'It looks as if duplicates exist for this Account' }).nth(3)

```

# Page snapshot

```yaml
- generic:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - link "Skip to Navigation" [ref=e4] [cursor=pointer]:
        - /url: javascript:void(0);
      - link "Skip to Main Content" [ref=e5] [cursor=pointer]:
        - /url: javascript:void(0);
      - generic [ref=e9]:
        - generic [ref=e13]:
          - button "Toggle Panel" [ref=e17] [cursor=pointer]:
            - img [ref=e21]
            - generic [ref=e24]: Menu
          - generic [ref=e29]:
            - img [ref=e33]
            - generic [ref=e37]: Sandbox (cpqpro)
        - button "Show menu" [ref=e46] [cursor=pointer]:
          - img [ref=e48]
          - generic [ref=e51]: Show menu
      - generic [ref=e52]:
        - button "Search" [ref=e58]:
          - img [ref=e60]
          - text: Search...
        - navigation "Global Header" [ref=e63]:
          - list [ref=e65]:
            - listitem [ref=e66]:
              - group [ref=e67]:
                - button "Add favorite" [ref=e69] [cursor=pointer]:
                  - generic [ref=e70]:
                    - img [ref=e74]
                    - tooltip "Add favorite"
                - button "Favorites list" [ref=e78] [cursor=pointer]:
                  - generic [ref=e79]:
                    - img [ref=e83]
                    - tooltip "Favorites list"
            - listitem [ref=e86]:
              - button "Global Actions" [ref=e92] [cursor=pointer]:
                - generic [ref=e93]:
                  - img [ref=e97]
                  - tooltip "Global Actions"
            - listitem [ref=e100]:
              - button "Guidance Center" [ref=e102] [cursor=pointer]:
                - generic [ref=e103]:
                  - img [ref=e107]
                  - tooltip "Guidance Center"
            - listitem [ref=e110]:
              - button "Salesforce Help" [ref=e113] [cursor=pointer]:
                - generic [ref=e114]:
                  - img [ref=e118]
                  - tooltip "Salesforce Help"
            - listitem [ref=e121]:
              - button "Setup" [ref=e127] [cursor=pointer]:
                - generic [ref=e128]:
                  - img [ref=e132]
                  - tooltip "Setup"
            - listitem [ref=e135]:
              - button "Notifications" [ref=e138] [cursor=pointer]:
                - generic [ref=e139]:
                  - img [ref=e144]
                  - tooltip "Notifications"
            - listitem [ref=e148]:
              - button "View profile" [ref=e151] [cursor=pointer]:
                - generic [ref=e152]:
                  - tooltip "View profile"
    - generic [ref=e156]:
      - generic [ref=e159]:
        - generic [ref=e161]:
          - navigation "App" [ref=e162]:
            - button "App Launcher" [ref=e164] [cursor=pointer]:
              - generic [ref=e175]: App Launcher
          - heading "IOH ESM" [level=1] [ref=e176]:
            - generic "IOH ESM" [ref=e177]
        - navigation "Global" [ref=e180]:
          - list [ref=e181]:
            - listitem [ref=e182]:
              - link "Home" [ref=e183] [cursor=pointer]:
                - /url: /lightning/page/home
                - generic [ref=e184]: Home
            - listitem [ref=e185]:
              - link "Leads" [ref=e186] [cursor=pointer]:
                - /url: /lightning/o/Lead/home
                - generic [ref=e187]: Leads
              - button "Leads List" [ref=e191] [cursor=pointer]:
                - img [ref=e195]
                - generic [ref=e198]: Leads List
            - listitem [ref=e199] [cursor=pointer]:
              - link "Accounts" [ref=e200]:
                - /url: /lightning/o/Account/home
                - generic [ref=e201]: Accounts
              - button "Accounts List" [ref=e205]:
                - img [ref=e209]
                - generic [ref=e212]: Accounts List
            - listitem [ref=e213]:
              - link "Opportunities" [ref=e214] [cursor=pointer]:
                - /url: /lightning/o/Opportunity/home
                - generic [ref=e215]: Opportunities
              - button "Opportunities List" [ref=e219] [cursor=pointer]:
                - img [ref=e223]
                - generic [ref=e226]: Opportunities List
            - listitem [ref=e227]:
              - link "Quotes" [ref=e228] [cursor=pointer]:
                - /url: /lightning/o/Quote/home
                - generic [ref=e229]: Quotes
              - button "Quotes List" [ref=e233] [cursor=pointer]:
                - img [ref=e237]
                - generic [ref=e240]: Quotes List
            - listitem [ref=e241]:
              - link "Field Service" [ref=e242] [cursor=pointer]:
                - /url: /lightning/n/FSL__FieldService
                - generic [ref=e243]: Field Service
            - listitem [ref=e244]:
              - link "Contracts" [ref=e245] [cursor=pointer]:
                - /url: /lightning/o/Contract/home
                - generic [ref=e246]: Contracts
              - button "Contracts List" [ref=e250] [cursor=pointer]:
                - img [ref=e254]
                - generic [ref=e257]: Contracts List
            - listitem [ref=e258]:
              - link "Orders" [ref=e259] [cursor=pointer]:
                - /url: /lightning/o/Order/home
                - generic [ref=e260]: Orders
              - button "Orders List" [ref=e264] [cursor=pointer]:
                - img [ref=e268]
                - generic [ref=e271]: Orders List
            - listitem [ref=e272]:
              - link "Orchestration Plans" [ref=e273] [cursor=pointer]:
                - /url: /lightning/o/vlocity_cmt__OrchestrationPlan__c/home
                - generic [ref=e274]: Orchestration Plans
              - button "Orchestration Plans List" [ref=e278] [cursor=pointer]:
                - img [ref=e282]
                - generic [ref=e285]: Orchestration Plans List
            - listitem [ref=e286]:
              - button "Show more navigation items" [ref=e288] [cursor=pointer]:
                - generic [ref=e289]: More
                - img [ref=e293]
                - generic [ref=e296]: Show more navigation items
            - listitem [ref=e297]:
              - button "Edit nav items" [ref=e299] [cursor=pointer]:
                - img [ref=e301]
                - generic [ref=e304]: Edit nav items
      - main [ref=e306]:
        - generic [ref=e322]:
          - generic [ref=e324]:
            - generic [ref=e331]:
              - generic [ref=e332]:
                - generic [ref=e333]:
                  - heading "Account TEST CA 11" [level=1] [ref=e343]:
                    - generic [ref=e345]: Account
                    - generic [ref=e346]: TEST CA 11
                  - button "View Account Hierarchy" [ref=e357] [cursor=pointer]:
                    - img [ref=e359]
                    - generic [ref=e362]: View Account Hierarchy
                - button "Follow" [ref=e367] [cursor=pointer]:
                  - generic [ref=e368]:
                    - img [ref=e372]
                    - text: Follow
                - generic [ref=e378]:
                  - generic "Create ESM Opportunity" [ref=e379]:
                    - button "Create ESM Opportunity" [ref=e384] [cursor=pointer]
                  - generic "Check Eligibility Status" [ref=e385]:
                    - button "Check Eligibility Status" [ref=e390] [cursor=pointer]
                  - generic "Create Enterprise Quote" [ref=e391]:
                    - button "Create Enterprise Quote" [ref=e396] [cursor=pointer]
                  - button "Show more actions" [ref=e398] [cursor=pointer]:
                    - img [ref=e400]
                    - generic [ref=e403]: Show more actions
              - generic [ref=e404]:
                - generic [ref=e406]:
                  - paragraph [ref=e407]: Account Record Type
                  - paragraph [ref=e408]:
                    - generic [ref=e412]: Customer Account
                - generic [ref=e414]:
                  - paragraph [ref=e415]: Parent Account
                  - paragraph [ref=e416]:
                    - generic [ref=e421]:
                      - link "TEST CCA 11" [ref=e422] [cursor=pointer]:
                        - /url: /lightning/r/Account/001MS00000AqVLLYA3/view
                        - generic [ref=e426]: TEST CCA 11
                      - button "Open TEST CCA 11 Preview" [ref=e428] [cursor=pointer]:
                        - img [ref=e430]
                        - generic [ref=e433]: Open TEST CCA 11 Preview
                - generic [ref=e435]:
                  - paragraph [ref=e436]: SF Account ID
                  - paragraph [ref=e437]:
                    - generic [ref=e438]: 001MS00000AqUCUYA3
                - generic [ref=e440]:
                  - paragraph [ref=e441]: CA Number
                  - paragraph
                - generic [ref=e443]:
                  - paragraph [ref=e444]: Account Status
                  - paragraph [ref=e445]:
                    - generic [ref=e446]: New
                - generic [ref=e448]:
                  - paragraph [ref=e449]: Eligibility Status
                  - paragraph
            - combobox [ref=e455]:
              - combobox [ref=e458]:
                - img [ref=e461]
                - textbox "What can I help you with?" [ref=e464]
                - option "⌘+K" [selected] [ref=e466]
          - generic [ref=e467]:
            - generic [ref=e473]:
              - heading "Tabs" [level=2] [ref=e474]
              - generic "Tabs" [ref=e475]:
                - generic [ref=e476]:
                  - heading "Tabs" [level=2] [ref=e477]
                  - tablist "Tabs" [ref=e479]:
                    - tab "Details" [selected] [ref=e480] [cursor=pointer]
                    - tab "Related" [ref=e481] [cursor=pointer]
                    - tab "Assets (ESM)" [ref=e482] [cursor=pointer]
                    - tab "Assets (CPQ)" [ref=e483] [cursor=pointer]
                    - tab "Hierarchy" [ref=e484] [cursor=pointer]
                    - tab "Account 360" [ref=e485] [cursor=pointer]
                  - tabpanel "Details" [ref=e488]:
                    - generic [ref=e501]:
                      - list [ref=e505]:
                        - generic [ref=e506]:
                          - generic [ref=e508]:
                            - listitem [ref=e510]:
                              - generic [ref=e511]:
                                - generic [ref=e512]: Salutation
                                - generic "Help Salutation":
                                  - button "Help Salutation" [ref=e515] [cursor=pointer]:
                                    - img [ref=e517]
                                    - generic [ref=e520]: Help Salutation
                                - generic [ref=e521]:
                                  - generic [ref=e523]: PT.
                                  - button "Edit Salutation" [ref=e524] [cursor=pointer]:
                                    - generic [ref=e526]: Edit Salutation
                            - listitem [ref=e528]:
                              - generic [ref=e529]:
                                - generic [ref=e530]: Account Record Type
                                - generic [ref=e535]:
                                  - generic [ref=e536]: Customer Account
                                  - button "Change Record Type" [ref=e538] [cursor=pointer]:
                                    - img [ref=e540]
                                    - generic [ref=e543]: Change Record Type
                          - generic [ref=e545]:
                            - listitem [ref=e547]:
                              - generic [ref=e548]:
                                - generic [ref=e549]: Account Name
                                - generic [ref=e550]:
                                  - generic [ref=e552]: TEST CA 11
                                  - button "Edit Account Name" [ref=e553] [cursor=pointer]:
                                    - generic [ref=e555]: Edit Account Name
                            - listitem [ref=e557]:
                              - generic [ref=e558]:
                                - generic [ref=e559]: Account Owner
                                - generic [ref=e564]:
                                  - generic [ref=e571]:
                                    - link "OCKY HARLIANSYAH" [ref=e572] [cursor=pointer]:
                                      - /url: /lightning/r/User/005J1000001AMWsIAO/view
                                      - generic [ref=e576]: OCKY HARLIANSYAH
                                    - button "Open OCKY HARLIANSYAH Preview" [ref=e578] [cursor=pointer]:
                                      - img [ref=e580]
                                      - generic [ref=e583]: Open OCKY HARLIANSYAH Preview
                                  - button "Change Owner" [ref=e585] [cursor=pointer]:
                                    - img [ref=e587]
                                    - generic [ref=e590]: Change Owner
                          - generic [ref=e592]:
                            - listitem [ref=e594]:
                              - generic [ref=e595]:
                                - generic [ref=e596]: Catalist Account Number
                                - button "Edit Catalist Account Number" [ref=e598] [cursor=pointer]:
                                  - generic [ref=e600]: Edit Catalist Account Number
                            - listitem [ref=e602]:
                              - generic [ref=e603]:
                                - generic [ref=e604]: Parent Account
                                - generic [ref=e605]:
                                  - generic [ref=e611]:
                                    - link "TEST CCA 11" [ref=e612] [cursor=pointer]:
                                      - /url: /lightning/r/Account/001MS00000AqVLLYA3/view
                                      - generic [ref=e616]: TEST CCA 11
                                    - button "Open TEST CCA 11 Preview" [ref=e618] [cursor=pointer]:
                                      - img [ref=e620]
                                      - generic [ref=e623]: Open TEST CCA 11 Preview
                                  - button "Edit Parent Account" [ref=e624] [cursor=pointer]:
                                    - generic [ref=e626]: Edit Parent Account
                          - generic [ref=e628]:
                            - listitem [ref=e630]:
                              - generic [ref=e631]:
                                - generic [ref=e632]: RBM Account Number
                                - button "Edit RBM Account Number" [ref=e634] [cursor=pointer]:
                                  - generic [ref=e636]: Edit RBM Account Number
                            - listitem [ref=e638]:
                              - generic [ref=e640]: CA Number
                          - generic [ref=e643]:
                            - listitem [ref=e645]:
                              - generic [ref=e646]:
                                - generic [ref=e647]: Account Source
                                - generic [ref=e648]:
                                  - generic [ref=e650]: Indosat Vendor Data
                                  - button "Edit Account Source" [ref=e651] [cursor=pointer]:
                                    - generic [ref=e653]: Edit Account Source
                            - listitem [ref=e655]:
                              - generic [ref=e656]:
                                - generic [ref=e657]: Is EOS Available?
                                - generic [ref=e658]:
                                  - generic [ref=e663]:
                                    - generic "False" [ref=e664]:
                                      - generic [ref=e665]:
                                        - img [ref=e667]
                                        - generic [ref=e670]: "False"
                                    - generic [ref=e671]: Is EOS Available?
                                  - button "Edit Is EOS Available?" [ref=e672] [cursor=pointer]:
                                    - generic [ref=e674]: Edit Is EOS Available?
                          - generic [ref=e676]:
                            - listitem [ref=e678]:
                              - generic [ref=e679]:
                                - generic [ref=e680]: Account Status
                                - generic [ref=e681]:
                                  - generic [ref=e683]: New
                                  - button "Edit Account Status" [ref=e684] [cursor=pointer]:
                                    - generic [ref=e686]: Edit Account Status
                            - listitem [ref=e688]:
                              - generic [ref=e689]:
                                - generic [ref=e690]: Eligibility Flag
                                - button "Edit Eligibility Flag" [ref=e692] [cursor=pointer]:
                                  - generic [ref=e694]: Edit Eligibility Flag
                          - generic [ref=e696]:
                            - listitem [ref=e698]:
                              - generic [ref=e699]:
                                - generic [ref=e700]: Status Date
                                - button "Edit Status Date" [ref=e702] [cursor=pointer]:
                                  - generic [ref=e704]: Edit Status Date
                            - listitem [ref=e706]:
                              - generic [ref=e707]:
                                - generic [ref=e708]: Eligibility Date
                                - button "Edit Eligibility Date" [ref=e710] [cursor=pointer]:
                                  - generic [ref=e712]: Edit Eligibility Date
                          - generic [ref=e714]:
                            - listitem [ref=e716]:
                              - generic [ref=e717]:
                                - generic [ref=e718]: Active Date
                                - button "Edit Active Date" [ref=e720] [cursor=pointer]:
                                  - generic [ref=e722]: Edit Active Date
                            - listitem [ref=e724]:
                              - generic [ref=e725]:
                                - generic [ref=e726]: Customer Id Number
                                - button "Edit Customer Id Number" [ref=e728] [cursor=pointer]:
                                  - generic [ref=e730]: Edit Customer Id Number
                          - generic [ref=e732]:
                            - listitem [ref=e734]:
                              - generic [ref=e735]:
                                - generic [ref=e736]: Account Classification
                                - button "Edit Account Classification" [ref=e738] [cursor=pointer]:
                                  - generic [ref=e740]: Edit Account Classification
                            - listitem [ref=e742]:
                              - generic [ref=e743]:
                                - generic [ref=e744]: Assignment Group
                                - button "Edit Assignment Group" [ref=e746] [cursor=pointer]:
                                  - generic [ref=e748]: Edit Assignment Group
                          - listitem [ref=e752]:
                            - generic [ref=e753]:
                              - generic [ref=e754]: Company Address
                              - generic [ref=e755]:
                                - link "Jalan Merdeka Barat Jakarta Pusat, DKI Jakarta 10110 Indonesia" [ref=e759] [cursor=pointer]:
                                  - /url: https://www.google.com/maps?q=Jalan%20Merdeka%20Barat%0AJakarta%20Pusat%2C%20DKI%20Jakarta%2010110%0AIndonesia
                                  - generic [ref=e760]: Jalan Merdeka Barat
                                  - generic [ref=e761]: Jakarta Pusat, DKI Jakarta 10110
                                  - generic [ref=e762]: Indonesia
                                  - iframe [ref=e766]:
                                    - img "Map" [ref=f12e2]
                                - button "Edit Company Address" [ref=e768] [cursor=pointer]:
                                  - generic [ref=e770]: Edit Company Address
                      - generic [ref=e773]:
                        - heading "Company Information" [level=3] [ref=e774]:
                          - button "Company Information" [expanded] [ref=e775] [cursor=pointer]:
                            - img [ref=e780]
                            - generic [ref=e783]: Company Information
                        - list [ref=e785]:
                          - generic [ref=e786]:
                            - generic [ref=e788]:
                              - listitem [ref=e790]:
                                - generic [ref=e791]:
                                  - generic [ref=e792]: Type
                                  - generic [ref=e793]:
                                    - generic [ref=e795]: Corporate
                                    - button "Edit Type" [ref=e796] [cursor=pointer]:
                                      - generic [ref=e798]: Edit Type
                              - listitem [ref=e800]:
                                - generic [ref=e801]:
                                  - generic [ref=e802]: VIP FLAG
                                  - generic [ref=e803]:
                                    - generic [ref=e808]:
                                      - generic "False" [ref=e809]:
                                        - generic [ref=e810]:
                                          - img [ref=e812]
                                          - generic [ref=e815]: "False"
                                      - generic [ref=e816]: VIP FLAG
                                    - button "Edit VIP FLAG" [ref=e817] [cursor=pointer]:
                                      - generic [ref=e819]: Edit VIP FLAG
                            - generic [ref=e821]:
                              - listitem [ref=e823]:
                                - generic [ref=e824]:
                                  - generic [ref=e825]: ID Type
                                  - generic [ref=e826]:
                                    - generic [ref=e828]: SIUP
                                    - button "Edit ID Type" [ref=e829] [cursor=pointer]:
                                      - generic [ref=e831]: Edit ID Type
                              - listitem [ref=e833]:
                                - generic [ref=e834]:
                                  - generic [ref=e835]: VIP Type
                                  - button "Edit VIP Type" [ref=e837] [cursor=pointer]:
                                    - generic [ref=e839]: Edit VIP Type
                            - generic [ref=e841]:
                              - listitem [ref=e843]:
                                - generic [ref=e844]:
                                  - generic [ref=e845]: ID Expiry Date
                                  - generic [ref=e846]:
                                    - generic [ref=e848]: 10/31/2040, 12:00 PM
                                    - button "Edit ID Expiry Date" [ref=e849] [cursor=pointer]:
                                      - generic [ref=e851]: Edit ID Expiry Date
                              - listitem [ref=e853]:
                                - generic [ref=e854]:
                                  - generic [ref=e855]: VIP Start Date
                                  - button "Edit VIP Start Date" [ref=e857] [cursor=pointer]:
                                    - generic [ref=e859]: Edit VIP Start Date
                            - generic [ref=e861]:
                              - listitem [ref=e863]:
                                - generic [ref=e864]:
                                  - generic [ref=e865]: ID Reference
                                  - generic [ref=e866]:
                                    - generic [ref=e868]: "1234567890120011"
                                    - button "Edit ID Reference" [ref=e869] [cursor=pointer]:
                                      - generic [ref=e871]: Edit ID Reference
                              - listitem [ref=e873]:
                                - generic [ref=e874]:
                                  - generic [ref=e875]: VIP Expiry Date
                                  - button "Edit VIP Expiry Date" [ref=e877] [cursor=pointer]:
                                    - generic [ref=e879]: Edit VIP Expiry Date
                            - generic [ref=e881]:
                              - listitem [ref=e883]:
                                - generic [ref=e884]:
                                  - generic [ref=e885]: NPWP
                                  - generic "Help NPWP":
                                    - button "Help NPWP" [ref=e888] [cursor=pointer]:
                                      - img [ref=e890]
                                      - generic [ref=e893]: Help NPWP
                                  - generic [ref=e894]:
                                    - generic [ref=e896]: "1234567890120011"
                                    - button "Edit NPWP" [ref=e897] [cursor=pointer]:
                                      - generic [ref=e899]: Edit NPWP
                              - listitem [ref=e901]:
                                - generic [ref=e902]:
                                  - generic [ref=e903]: VIP Description
                                  - button "Edit VIP Description" [ref=e905] [cursor=pointer]:
                                    - generic [ref=e907]: Edit VIP Description
                            - generic [ref=e909]:
                              - listitem [ref=e911]:
                                - generic [ref=e912]:
                                  - generic [ref=e913]: Company Anniversary
                                  - generic "Help Company Anniversary":
                                    - button "Help Company Anniversary" [ref=e916] [cursor=pointer]:
                                      - img [ref=e918]
                                      - generic [ref=e921]: Help Company Anniversary
                                  - button "Edit Company Anniversary" [ref=e923] [cursor=pointer]:
                                    - generic [ref=e925]: Edit Company Anniversary
                              - listitem [ref=e927]:
                                - generic [ref=e928]:
                                  - generic [ref=e929]: VIP Card Number
                                  - button "Edit VIP Card Number" [ref=e931] [cursor=pointer]:
                                    - generic [ref=e933]: Edit VIP Card Number
                            - generic [ref=e935]:
                              - listitem [ref=e937]:
                                - generic [ref=e938]:
                                  - generic [ref=e939]: Number Of Employees
                                  - generic "Help Number Of Employees":
                                    - button "Help Number Of Employees" [ref=e942] [cursor=pointer]:
                                      - img [ref=e944]
                                      - generic [ref=e947]: Help Number Of Employees
                                  - button "Edit Number Of Employees" [ref=e949] [cursor=pointer]:
                                    - generic [ref=e951]: Edit Number Of Employees
                              - listitem [ref=e953]:
                                - generic [ref=e954]:
                                  - generic [ref=e955]: VIP Integration Status
                                  - button "Edit VIP Integration Status" [ref=e957] [cursor=pointer]:
                                    - generic [ref=e959]: Edit VIP Integration Status
                      - generic [ref=e961]:
                        - heading "Account Summary" [level=3] [ref=e962]:
                          - button "Account Summary" [expanded] [ref=e963] [cursor=pointer]:
                            - img [ref=e968]
                            - generic [ref=e971]: Account Summary
                        - list [ref=e973]:
                          - generic [ref=e974]:
                            - generic [ref=e976]:
                              - listitem [ref=e978]:
                                - generic [ref=e979]:
                                  - generic [ref=e980]: Line Of Business
                                  - generic [ref=e981]:
                                    - generic [ref=e983]: Communications & Technologies
                                    - button "Edit Line Of Business" [ref=e984] [cursor=pointer]:
                                      - generic [ref=e986]: Edit Line Of Business
                              - listitem [ref=e988]:
                                - generic [ref=e989]:
                                  - generic [ref=e990]: Sub Line of Business
                                  - generic [ref=e991]:
                                    - generic [ref=e993]: Content Provider
                                    - button "Edit Sub Line of Business" [ref=e994] [cursor=pointer]:
                                      - generic [ref=e996]: Edit Sub Line of Business
                            - generic [ref=e998]:
                              - listitem [ref=e1000]:
                                - generic [ref=e1001]:
                                  - generic [ref=e1002]: Customer Segment
                                  - generic [ref=e1003]:
                                    - generic [ref=e1005]: Large Enterprise
                                    - button "Edit Customer Segment" [ref=e1006] [cursor=pointer]:
                                      - generic [ref=e1008]: Edit Customer Segment
                              - listitem [ref=e1010]:
                                - generic [ref=e1011]:
                                  - generic [ref=e1012]: Corporate Scale
                                  - generic [ref=e1013]:
                                    - generic [ref=e1015]: Multinational Company
                                    - button "Edit Corporate Scale" [ref=e1016] [cursor=pointer]:
                                      - generic [ref=e1018]: Edit Corporate Scale
                      - generic [ref=e1020]:
                        - heading "Company Contact Information" [level=3] [ref=e1021]:
                          - button "Company Contact Information" [expanded] [ref=e1022] [cursor=pointer]:
                            - img [ref=e1027]
                            - generic [ref=e1030]: Company Contact Information
                        - list [ref=e1032]:
                          - generic [ref=e1033]:
                            - generic [ref=e1035]:
                              - listitem [ref=e1037]:
                                - generic [ref=e1038]:
                                  - generic [ref=e1039]: Main Contact Area Code
                                  - generic [ref=e1040]:
                                    - generic [ref=e1042]: "021"
                                    - button "Edit Main Contact Area Code" [ref=e1043] [cursor=pointer]:
                                      - generic [ref=e1045]: Edit Main Contact Area Code
                              - listitem [ref=e1047]:
                                - generic [ref=e1048]:
                                  - generic [ref=e1049]: Fax
                                  - button "Edit Fax" [ref=e1051] [cursor=pointer]:
                                    - generic [ref=e1053]: Edit Fax
                            - generic [ref=e1055]:
                              - listitem [ref=e1057]:
                                - generic [ref=e1058]:
                                  - generic [ref=e1059]: Phone
                                  - generic [ref=e1060]:
                                    - link "25567889" [ref=e1065] [cursor=pointer]:
                                      - /url: tel:25567889
                                    - button "Edit Phone" [ref=e1066] [cursor=pointer]:
                                      - generic [ref=e1068]: Edit Phone
                              - listitem [ref=e1070]:
                                - generic [ref=e1071]:
                                  - generic [ref=e1072]: Fax Number Code
                                  - button "Edit Fax Number Code" [ref=e1074] [cursor=pointer]:
                                    - generic [ref=e1076]: Edit Fax Number Code
                            - generic [ref=e1078]:
                              - listitem [ref=e1080]:
                                - generic [ref=e1081]:
                                  - generic [ref=e1082]: Email
                                  - generic [ref=e1083]:
                                    - link "account.ca.11@company.co.id" [ref=e1089] [cursor=pointer]:
                                      - /url: mailto:account.ca.11@company.co.id
                                    - button "Edit Email" [ref=e1090] [cursor=pointer]:
                                      - generic [ref=e1092]: Edit Email
                              - listitem [ref=e1094]:
                                - generic [ref=e1095]:
                                  - generic [ref=e1096]: Main fax number
                                  - button "Edit Main fax number" [ref=e1098] [cursor=pointer]:
                                    - generic [ref=e1100]: Edit Main fax number
                            - generic [ref=e1102]:
                              - listitem [ref=e1104]:
                                - generic [ref=e1105]:
                                  - generic [ref=e1106]: Primary Contact
                                  - generic [ref=e1107]:
                                    - generic [ref=e1113]:
                                      - link "Test Contact" [ref=e1114] [cursor=pointer]:
                                        - /url: /lightning/r/Contact/003MS000008iCX8YAM/view
                                        - generic [ref=e1118]: Test Contact
                                      - button "Open Test Contact Preview" [ref=e1120] [cursor=pointer]:
                                        - img [ref=e1122]
                                        - generic [ref=e1125]: Open Test Contact Preview
                                    - button "Edit Primary Contact" [ref=e1126] [cursor=pointer]:
                                      - generic [ref=e1128]: Edit Primary Contact
                              - listitem [ref=e1130]:
                                - generic [ref=e1131]:
                                  - generic [ref=e1132]: Website
                                  - button "Edit Website" [ref=e1134] [cursor=pointer]:
                                    - generic [ref=e1136]: Edit Website
                            - generic [ref=e1138]:
                              - listitem [ref=e1140]:
                                - generic [ref=e1141]:
                                  - generic [ref=e1142]: Contact Preferences
                                  - generic [ref=e1143]:
                                    - generic [ref=e1145]: eMail
                                    - button "Edit Contact Preferences" [ref=e1146] [cursor=pointer]:
                                      - generic [ref=e1148]: Edit Contact Preferences
                              - listitem [ref=e1150]:
                                - generic [ref=e1151]:
                                  - generic [ref=e1152]: Primary Address
                                  - button "Edit Primary Address" [ref=e1155] [cursor=pointer]:
                                    - generic [ref=e1157]: Edit Primary Address
                      - generic [ref=e1159]:
                        - heading "Invoice Profile" [level=3] [ref=e1160]:
                          - button "Invoice Profile" [expanded] [ref=e1161] [cursor=pointer]:
                            - img [ref=e1166]
                            - generic [ref=e1169]: Invoice Profile
                        - list [ref=e1171]:
                          - generic [ref=e1172]:
                            - generic [ref=e1174]:
                              - listitem [ref=e1176]:
                                - generic [ref=e1177]:
                                  - generic [ref=e1178]: Summary Statement Flag
                                  - generic [ref=e1179]:
                                    - generic [ref=e1184]:
                                      - generic "False" [ref=e1185]:
                                        - generic [ref=e1186]:
                                          - img [ref=e1188]
                                          - generic [ref=e1191]: "False"
                                      - generic [ref=e1192]: Summary Statement Flag
                                    - button "Edit Summary Statement Flag" [ref=e1193] [cursor=pointer]:
                                      - generic [ref=e1195]: Edit Summary Statement Flag
                              - listitem [ref=e1197]:
                                - generic [ref=e1198]:
                                  - generic [ref=e1199]: Statement Flag
                                  - generic "Help Statement Flag":
                                    - button "Help Statement Flag" [ref=e1202] [cursor=pointer]:
                                      - img [ref=e1204]
                                      - generic [ref=e1207]: Help Statement Flag
                                  - generic [ref=e1208]:
                                    - generic [ref=e1213]:
                                      - generic "False" [ref=e1214]:
                                        - generic [ref=e1215]:
                                          - img [ref=e1217]
                                          - generic [ref=e1220]: "False"
                                      - generic [ref=e1221]: Statement Flag
                                    - button "Edit Statement Flag" [ref=e1222] [cursor=pointer]:
                                      - generic [ref=e1224]: Edit Statement Flag
                            - generic [ref=e1226]:
                              - listitem [ref=e1228]:
                                - generic [ref=e1229]:
                                  - generic [ref=e1230]: Invoice Integration Status
                                  - button "Edit Invoice Integration Status" [ref=e1232] [cursor=pointer]:
                                    - generic [ref=e1234]: Edit Invoice Integration Status
                              - listitem [ref=e1236]:
                                - generic [ref=e1237]:
                                  - generic [ref=e1238]: Invoice Integration Message
                                  - button "Edit Invoice Integration Message" [ref=e1240] [cursor=pointer]:
                                    - generic [ref=e1242]: Edit Invoice Integration Message
                      - generic [ref=e1244]:
                        - heading "System Information" [level=3] [ref=e1245]:
                          - button "System Information" [expanded] [ref=e1246] [cursor=pointer]:
                            - img [ref=e1251]
                            - generic [ref=e1254]: System Information
                        - list [ref=e1256]:
                          - generic [ref=e1257]:
                            - generic [ref=e1259]:
                              - listitem [ref=e1261]:
                                - generic [ref=e1262]:
                                  - generic [ref=e1263]: Created By
                                  - generic [ref=e1267]:
                                    - generic [ref=e1273]:
                                      - link "OCKY HARLIANSYAH" [ref=e1274] [cursor=pointer]:
                                        - /url: /lightning/r/User/005J1000001AMWsIAO/view
                                        - generic [ref=e1278]: OCKY HARLIANSYAH
                                      - button "Open OCKY HARLIANSYAH Preview" [ref=e1280] [cursor=pointer]:
                                        - img [ref=e1282]
                                        - generic [ref=e1285]: Open OCKY HARLIANSYAH Preview
                                    - text: ", 4/13/2026, 10:49 PM"
                              - listitem [ref=e1287]:
                                - generic [ref=e1288]:
                                  - generic [ref=e1289]: Last Modified By
                                  - generic [ref=e1293]:
                                    - generic [ref=e1299]:
                                      - link "OCKY HARLIANSYAH" [ref=e1300] [cursor=pointer]:
                                        - /url: /lightning/r/User/005J1000001AMWsIAO/view
                                        - generic [ref=e1304]: OCKY HARLIANSYAH
                                      - button "Open OCKY HARLIANSYAH Preview" [ref=e1306] [cursor=pointer]:
                                        - img [ref=e1308]
                                        - generic [ref=e1311]: Open OCKY HARLIANSYAH Preview
                                    - text: ", 4/13/2026, 10:49 PM"
                            - generic [ref=e1313]:
                              - listitem [ref=e1315]:
                                - generic [ref=e1316]:
                                  - generic [ref=e1317]: Integration Status
                                  - button "Edit Integration Status" [ref=e1319] [cursor=pointer]:
                                    - generic [ref=e1321]: Edit Integration Status
                              - listitem [ref=e1323]:
                                - generic [ref=e1324]:
                                  - generic [ref=e1325]: Integration Message
                                  - button "Edit Integration Message" [ref=e1327] [cursor=pointer]:
                                    - generic [ref=e1329]: Edit Integration Message
            - generic [ref=e1331]:
              - article [ref=e1336]:
                - generic [ref=e1338]:
                  - img [ref=e1343]
                  - heading "We found no potential duplicates of this Account." [level=2] [ref=e1347]:
                    - generic "We found no potential duplicates of this Account." [ref=e1348]
              - article [ref=e1353]:
                - generic [ref=e1356]:
                  - generic [ref=e1358]:
                    - generic [ref=e1359]:
                      - generic [ref=e1360]: Encryption Field
                      - button "Toggle Section" [ref=e1362] [cursor=pointer]:
                        - img [ref=e1364]
                        - generic [ref=e1367]: Toggle Section
                    - button "Show All" [ref=e1370] [cursor=pointer]
                  - generic [ref=e1373]:
                    - generic [ref=e1375]:
                      - generic [ref=e1376]: Email
                      - generic [ref=e1380]: "******"
                    - generic [ref=e1382]:
                      - generic [ref=e1383]: Account Phone
                      - generic [ref=e1387]: "******"
                    - generic [ref=e1390]: Main fax number
                    - generic [ref=e1396]:
                      - generic [ref=e1397]: ID Reference
                      - generic [ref=e1401]: "******"
                    - generic [ref=e1403]:
                      - generic [ref=e1404]: NPWP
                      - generic [ref=e1408]: "******"
                    - generic [ref=e1411]: Delivery Address
              - generic [ref=e1419]:
                - heading "Tabs" [level=2] [ref=e1420]
                - generic "Tabs" [ref=e1421]:
                  - generic [ref=e1422]:
                    - heading "Tabs" [level=2] [ref=e1423]
                    - tablist "Tabs" [ref=e1425]:
                      - tab "Activity" [selected] [ref=e1426] [cursor=pointer]
                      - tab "Chatter" [ref=e1427] [cursor=pointer]
                    - tabpanel "Activity" [ref=e1430]:
                      - generic [ref=e1436]:
                        - heading "Activity Publisher" [level=2] [ref=e1437]
                        - generic [ref=e1438]:
                          - group [ref=e1439]:
                            - generic [ref=e1441]:
                              - button "New Task" [ref=e1442] [cursor=pointer]:
                                - generic [ref=e1444]:
                                  - img [ref=e1446]
                                  - generic [ref=e1449]: New Task
                                - generic: New Task
                              - generic [ref=e1450]:
                                - button "No Additional New Task Actions" [disabled]:
                                  - generic:
                                    - img
                                  - generic: No Additional New Task Actions
                          - group [ref=e1451]:
                            - generic [ref=e1453]:
                              - button "New Event" [ref=e1454] [cursor=pointer]:
                                - generic [ref=e1456]:
                                  - img [ref=e1458]
                                  - generic [ref=e1461]: New Event
                                - generic: New Event
                              - button "More New Event Actions" [ref=e1463] [cursor=pointer]:
                                - img [ref=e1465]
                                - generic [ref=e1468]: More New Event Actions
                          - group [ref=e1469]:
                            - generic [ref=e1471]:
                              - button "Email" [ref=e1472] [cursor=pointer]:
                                - generic [ref=e1474]:
                                  - img [ref=e1476]
                                  - generic [ref=e1479]: Email
                                - generic: Email
                              - button "More Email Actions" [ref=e1481] [cursor=pointer]:
                                - img [ref=e1483]
                                - generic [ref=e1486]: More Email Actions
                        - heading "Activity Timeline" [level=2] [ref=e1487]
                        - generic [ref=e1489]:
                          - link "Skip to the bottom of the activity timeline" [ref=e1490] [cursor=pointer]:
                            - /url: javascript:void(0);
                          - generic [ref=e1492]:
                            - generic [ref=e1494]: "Filters: All time • All activities • All types"
                            - button "Timeline Settings" [ref=e1495] [cursor=pointer]:
                              - img [ref=e1497]
                              - generic [ref=e1500]: Timeline Settings
                          - generic [ref=e1503]:
                            - button "Refresh" [ref=e1504] [cursor=pointer]
                            - text: •
                            - button "Expand All. Show details for activities in the timeline." [ref=e1505] [cursor=pointer]: Expand All
                            - text: •
                            - button "View All" [ref=e1506] [cursor=pointer]
                          - generic [ref=e1508]:
                            - heading "Upcoming & Overdue" [level=3] [ref=e1509]:
                              - button "Upcoming & Overdue" [expanded] [ref=e1510] [cursor=pointer]:
                                - img [ref=e1512]
                                - text: Upcoming & Overdue
                            - generic [ref=e1515]:
                              - generic:
                                - list
                              - generic [ref=e1518]:
                                - text: No activities to show.
                                - text: Get started by sending an email, scheduling a task, and more.
                          - status [ref=e1519]:
                            - generic [ref=e1521]:
                              - img [ref=e1525]
                              - generic [ref=e1528]: information
                            - paragraph [ref=e1530]: To change what's shown, try changing your filters.
                          - button "Show All Activities" [ref=e1532] [cursor=pointer]
                          - link "Skip to the top of the activity timeline" [ref=e1533] [cursor=pointer]:
                            - /url: javascript:void(0);
              - article [ref=e1539]:
                - generic [ref=e1541]:
                  - img [ref=e1546]
                  - heading "Integration Activity" [level=2] [ref=e1550]:
                    - generic [ref=e1551]: Integration Activity
                  - button "Refresh" [ref=e1555] [cursor=pointer]:
                    - img [ref=e1557]
                    - generic [ref=e1560]: Refresh
                - generic [ref=e1562]:
                  - generic [ref=e1563]:
                    - generic [ref=e1566]:
                      - generic [ref=e1567]: Status
                      - generic [ref=e1571]:
                        - combobox "Status" [ref=e1572] [cursor=pointer]:
                          - generic [ref=e1573]: All
                        - img [ref=e1577]
                      - status
                    - generic [ref=e1583]:
                      - generic [ref=e1584]: Search
                      - generic [ref=e1585]:
                        - searchbox "Search" [ref=e1586]
                        - img [ref=e1587]
                  - generic [ref=e1590]:
                    - img [ref=e1594]
                    - paragraph [ref=e1597]: No integration activities found for this record.
  - status [ref=e1602]: Success notification.Account "TEST CA 11" was created. Press Control + F6 to navigate to the next toast notification or focusable region..
```

# Test source

```ts
  252 |     });
  253 | 
  254 |     await test.step('TC007_S04 - Fill in all mandatory fields', async () => {
  255 |         await page.getByRole('combobox', { name: 'Salutation' }).click();
  256 |         await page.getByRole('option', { name: 'PT.' }).click();
  257 | 
  258 |         await page.getByRole('textbox', { name: 'Account Name' }).click();
  259 |         await page.getByRole('textbox', { name: 'Account Name' }).fill(data.tc002.accountName + ' ' + counter);
  260 | 
  261 |         await page.getByRole('combobox', { name: 'Account Source' }).click();
  262 |         await page.getByRole('option', { name: 'Indosat Vendor Data' }).click();
  263 | 
  264 |         await page.getByRole('combobox', { name: 'Account Status' }).click();
  265 |         await page.getByRole('option', { name: 'New' }).click();
  266 | 
  267 |         await page.getByRole('textbox', { name: 'Company Street' }).click();
  268 |         await page.getByRole('textbox', { name: 'Company Street' }).fill('Jalan Merdeka Barat');
  269 | 
  270 |         await page.getByRole('textbox', { name: 'Company City' }).click();
  271 |         await page.getByRole('textbox', { name: 'Company City' }).fill('Jakarta Pusat');
  272 | 
  273 |         await page.getByRole('textbox', { name: 'Company State/Province' }).click();
  274 |         await page.getByRole('textbox', { name: 'Company State/Province' }).fill('DKI Jakarta');
  275 | 
  276 |         await page.getByRole('textbox', { name: 'Company Zip/Postal Code' }).click();
  277 |         await page.getByRole('textbox', { name: 'Company Zip/Postal Code' }).fill('10110');
  278 | 
  279 |         await page.getByRole('textbox', { name: 'Company Country' }).click();
  280 |         await page.getByRole('textbox', { name: 'Company Country' }).fill('Indonesia');
  281 | 
  282 |         await page.getByRole('combobox', { name: 'Type', exact: true }).click();
  283 |         await page.getByRole('option', { name: 'Corporate', exact: true }).click();
  284 | 
  285 |         await page.getByRole('combobox', { name: 'ID Type' }).click();
  286 |         await page.getByRole('option', { name: 'SIUP' }).click();
  287 | 
  288 |         await page.getByLabel('*Date').click();
  289 |         await page.getByLabel('Pick a Year').selectOption('2040');
  290 |         await page.getByRole('button', { name: 'Next Month' }).click();
  291 |         await page.getByRole('button', { name: 'Next Month' }).dblclick();
  292 |         await page.getByRole('button', { name: 'Next Month' }).click();
  293 |         await page.getByRole('button', { name: 'Next Month' }).click();
  294 |         await page.getByRole('button', { name: 'Next Month' }).click();
  295 |         await page.getByRole('button', { name: '31' }).click();
  296 | 
  297 |         await page.getByRole('textbox', { name: 'ID Reference' }).click();
  298 |         await page.getByRole('textbox', { name: 'ID Reference' }).fill(data.tc002.idReference + counter.toString().padStart(4, '0'));
  299 | 
  300 |         await page.getByRole('textbox', { name: 'NPWP' }).click();
  301 |         await page.getByRole('textbox', { name: 'NPWP' }).fill(data.tc002.idReference + counter.toString().padStart(4, '0'));
  302 | 
  303 |         await page.getByRole('combobox', { name: 'Line Of Business', exact: true }).click();
  304 |         await page.getByRole('option', { name: 'Communications & Technologies' }).click();
  305 | 
  306 |         await page.getByRole('combobox', { name: 'Sub Line of Business' }).click();
  307 |         await page.getByRole('option', { name: 'Content Provider' }).click();
  308 | 
  309 |         await page.getByRole('combobox', { name: 'Customer Segment' }).click();
  310 |         await page.getByRole('option', { name: 'Large Enterprise' }).click();
  311 | 
  312 |         await page.getByRole('combobox', { name: 'Corporate Scale' }).click();
  313 |         await page.getByRole('option', { name: 'Multinational Company' }).click();
  314 | 
  315 |         await page.getByRole('textbox', { name: 'Main Contact Area Code' }).click();
  316 |         await page.getByRole('textbox', { name: 'Main Contact Area Code' }).fill('021');
  317 | 
  318 |         await page.getByRole('textbox', { name: 'Phone' }).click();
  319 |         await page.getByRole('textbox', { name: 'Phone' }).fill(data.tc002.phone);
  320 | 
  321 |         await page.getByRole('textbox', { name: 'Email' }).click();
  322 |         await page.getByRole('textbox', { name: 'Email' }).fill('account.ca.' + counter + '@company.co.id');
  323 | 
  324 |         await page.getByRole('combobox', { name: 'Primary Contact' }).click();
  325 |         await page.getByRole('combobox', { name: 'Primary Contact' }).fill('test cont');
  326 |         await page.getByRole('option', { name: 'Test Contact TEST CREATE CA' }).click();
  327 | 
  328 |         await page.getByRole('option', { name: 'eMail' }).click();
  329 |         await page.getByRole('button', { name: 'Move selection to Chosen' }).click();
  330 | 
  331 |         // Expected: All required fields are populated and no validation errors appear
  332 |         await expect(page.getByRole('textbox', { name: 'Account Name' })).toHaveValue(data.tc002.accountName + ' ' + counter);
  333 |     });
  334 | 
  335 |     await test.step('TC007_S05 - Select the appropriate Level 1 Customer Account in the Parent Account field', async () => {
  336 |         await page.getByRole('combobox', { name: 'Parent Account' }).click();
  337 |         await page.getByRole('combobox', { name: 'Parent Account' }).fill(data.tc001.accountName + ' ' + counter);
  338 |         await page.getByRole('listbox', { name: 'Parent Account' })
  339 |         .getByRole('group', { name: 'Search Results' })
  340 |         .getByRole('option', { name: data.tc001.accountName + ' ' + counter })
  341 |         .click();
  342 | 
  343 |         // Expected: The Parent Account field displays the selected Level 1 CA
  344 |         await expect(page.getByRole('combobox', { name: 'Parent Account' })).toHaveValue(data.tc001.accountName.toUpperCase() + ' ' + counter);
  345 |     });
  346 | 
  347 |     await test.step('TC007_S06 - Click Save', async () => {
  348 |         await page.getByRole('button', { name: 'Save', exact: true }).click();
  349 |         await page.waitForURL('**/lightning/r/Account/**');
  350 | 
  351 |         // Expected: A new Customer Account record is successfully created and the record detail page is displayed
> 352 |         await expect(page.locator('div').filter({ hasText: 'It looks as if duplicates exist for this Account' }).nth(3)).toBeVisible();
      |                                                                                                                          ^ Error: expect(locator).toBeVisible() failed
  353 |     });
  354 | });
  355 | 
```