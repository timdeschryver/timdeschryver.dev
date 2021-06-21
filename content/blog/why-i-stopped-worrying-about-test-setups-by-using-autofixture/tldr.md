Here are some highlights why I think you should be using AutoFixture as a test fixture builder:

- tests remain clean and focused about the requirements;
- low coupling between test code and application code; application code can change without having an impact on the existing tests
- test setup code doesn't need to be discussed, implemented, nor maintained; the defaults values of AutoFixture provide a good baseline that can be patched where needed, you also don't need to reflect on providing proper test data because constrained non-deterministic data is everything you need for your test data
- AutoFixture's API is extensible for manual overwrites; properties can be overwritten with Customizations and SpecimenBuilders. For specific one-off tests, the object under test can be overwritten in the test
- it can detect quirks in your application code that you haven't thought of; can your application handle unexpected user inputs?
- it's a quick and simple way to explore a new code base that has little to no tests; if you don't know the domain and the relations between the models, it's hard to provide test data. Luckily this is one of the strong points of AutoFixture, providing fixture
