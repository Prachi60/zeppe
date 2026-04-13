const fs = require('fs');
let content = fs.readFileSync('c:/Users/DELL/Desktop/zeppe/zeppe/frontend/src/modules/customer/pages/Home.jsx', 'utf8');
let lines = content.split(/\r?\n/);
let newLines = [
'                {/* Top Brands between Special and Dry Fruits */}',
'                {section.id === "special" && (',
'                  <div className="py-2 mt-2">',
'                    <div className="flex items-center justify-between mb-4 px-4">',
'                      <h2 className="text-[17px] font-black tracking-tight text-[#111111]">',
'                        Top Brands',
'                      </h2>',
'                      <span',
'                        onClick={() => navigate("/offers")}',
'                        className="text-[12px] font-bold text-[#111111] cursor-pointer hover:underline"',
'                      >',
'                        See All',
'                      </span>',
'                    </div>',
'                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 px-4 mb-2">',
'                      {[',
'                        { name: "Big Sam\'s", image: "https://shop.bigsams.in/cdn/shop/files/Big_Sam_s_Website_Logo.png" },',
'                        { name: "Cello", image: "https://m.media-amazon.com/images/S/aplus-media-library-service-media/fd454316-c958-4cca-becc-82fdf6200bd1.__CR0,0,300,300_PT0_SX300_V1___.jpg" },',
'                        { name: "Classmate", image: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Classmate_logo.png" },',
'                        { name: "Milton", image: "https://m.media-amazon.com/images/S/aplus-media-library-service-media/390db5fe-ad79-4ef3-b4d4-282effa5c531.__CR0,0,300,300_PT0_SX300_V1___.png" },',
'                        { name: "Nivea", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Nivea_logo.svg/200px-Nivea_logo.svg.png" }',
'                      ].map((brand, i) => (',
'                        <div',
'                          key={i}',
'                          onClick={() => navigate("/search", { state: { query: brand.name } })}',
'                          className="flex-shrink-0 w-[85px] h-[85px] sm:w-[110px] sm:h-[110px] rounded-[14px] border border-[#e8e8e8] bg-white flex items-center justify-center p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"',
'                        >',
'                          <img src={brand.image} alt={brand.name} className="w-full h-full object-contain mix-blend-multiply" />',
'                        </div>',
'                      ))}',
'                    </div>',
'                  </div>',
'                )}'
];
lines.splice(2217, 62, ...newLines);
fs.writeFileSync('c:/Users/DELL/Desktop/zeppe/zeppe/frontend/src/modules/customer/pages/Home.jsx', lines.join('\n'));
