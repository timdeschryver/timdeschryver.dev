```csharp
Student[] students = [
    new("Alice", "A"),
    new("Bob", "B"),
    new("Charlie", "C"),
    new("David", "B"),
    new("Eve", "A")
];

Console.WriteLine("Index()");
IEnumerable<(int, Student)> studentsWithIndex = students.Index();

foreach (var (index, student) in studentsWithIndex)
{
    Console.WriteLine($"Student {index}: {student.Name}");
}

/*
Output: Index()

Student 0: Alice
Student 1: Bob
Student 2: Charlie
Student 3: David
Student 4: Eve
*/

Console.WriteLine("\nCountBy");
IEnumerable<KeyValuePair<string, int>> studentCountByScore = students.CountBy(keySelector: student => student.Score);

foreach (var (score, count) in studentCountByScore)
{
    Console.WriteLine($"Students with a {score}-score: {count}");
}

/*
Output: CountBy

Students with a A-score: 2
Students with a B-score: 2
Students with a C-score: 1
*/

Console.WriteLine("\nCountBy 2");
IEnumerable<KeyValuePair<bool, int>> studentsCountPassedOrFailed = students.CountBy(keySelector: student => student.Score is "A" or "B");

foreach (var (passed, count) in studentsCountPassedOrFailed)
{
    Console.WriteLine($"Students that {(passed ? "passed" : "failed")}: {count}");
}


/*
Output: CountBy 2

Students that passed: 4
Students that failed: 1
*/

Console.WriteLine("\nAggregateBy()");
IEnumerable<KeyValuePair<string, List<string>>> studentsByScore = students.AggregateBy(
    keySelector: student => student.Score,
    seed: new List<string>(),
    func: (group, student) => [..group, student.Name]);

foreach (var (score, studentGroup) in studentsByScore)
{
    Console.WriteLine($"Students with a {score}-score: {string.Join(", ", studentGroup)}");
}

/*
Output: AggregateBy()

Students with a A-score: Alice, Eve
Students with a B-score: Bob, David
Students with a C-score: Charlie
*/

record Student (string Name, string Score);
```
